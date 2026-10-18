-- MedLink SA: Supabase Auth link, signup trigger, Row Level Security and data integrity rules.
--
-- Hand-written migration (Prisma does not manage the auth schema, triggers, policies or CHECKs).
--
-- Requires Supabase: the auth schema (auth.users, auth.uid()) and the anon/authenticated roles.
-- On plain PostgreSQL (CI, Prisma shadow database) the Supabase-specific part is skipped with a
-- NOTICE so `prisma migrate deploy` still succeeds; RLS, the CHECK constraints and the
-- updated_at triggers are still created.
--
-- Data access model:
--   * The Next.js API connects through Prisma as the table owner, which BYPASSES RLS.
--     Every API query must therefore be scoped to the authenticated user in code.
--   * RLS is defence in depth for the Supabase Data API (PostgREST), which is reachable with the
--     publishable/anon key that ships inside the Android app.
--   * Medical records are written by patients themselves (the Android Records screen lets a patient
--     add their own records), so authenticated users may insert/update/delete their own rows, limited
--     to the content columns. id, created_at and updated_at always come from the database.
--
-- Applied once by `prisma migrate deploy`; not designed to be re-run by hand.

-- 1. Enable RLS everywhere (works on any PostgreSQL; the table owner is not affected).
ALTER TABLE "public"."profiles"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."emergency_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_settings"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."facilities"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."practitioners"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."appointments"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."medical_records"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."queue_tickets"      ENABLE ROW LEVEL SECURITY;
-- Prisma's migration history table lives in public too; with RLS on and no policies the Data API
-- roles cannot read or change it (Prisma connects as the owner and is unaffected).
ALTER TABLE IF EXISTS "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- 2. Data integrity rules that Prisma 6 cannot express in schema.prisma.
ALTER TABLE "public"."queue_tickets"
  ADD CONSTRAINT "queue_tickets_ticket_number_check" CHECK ("ticket_number" > 0),
  ADD CONSTRAINT "queue_tickets_estimated_wait_min_check" CHECK ("estimated_wait_min" >= 0);
ALTER TABLE "public"."facilities"
  ADD CONSTRAINT "facilities_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90),
  ADD CONSTRAINT "facilities_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180);

-- 3. updated_at is always set by the database on UPDATE, whoever writes the row
--    (Prisma's @updatedAt value is overwritten with the same kind of timestamp).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.emergency_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.practitioners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.queue_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Supabase-only objects.
DO $migration$
BEGIN
  IF to_regclass('auth.users') IS NULL
     OR to_regprocedure('auth.uid()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'Supabase auth schema/roles not found: skipping auth triggers, grants and RLS policies.';
    RETURN;
  END IF;

  -- 4a. Link profiles to auth.users WITHOUT a cross-schema foreign key.
  --     A FK public.profiles -> auth.users makes Prisma introspection (migrate dev drift check,
  --     migrate diff --from-url, db pull) fail with P4002 unless the auth schema is modelled.
  --     Instead, the AFTER INSERT trigger below creates the profile, an AFTER UPDATE OF email
  --     trigger keeps profiles.email in sync, and an AFTER DELETE trigger removes the profile
  --     (cascading to every patient-owned row through the Prisma-managed FKs).

  -- 4b. Signup trigger: create profile, settings and an empty emergency profile for every new user.
  --     The role is always 'patient'; user-supplied metadata never sets the role.
  CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $fn$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      left(coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), 100),
      'patient'::public.user_role
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.emergency_profiles (patient_id) VALUES (NEW.id) ON CONFLICT (patient_id) DO NOTHING;

    RETURN NEW;
  END;
  $fn$;

  REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

  -- 4c. Email change: copy the new auth email onto the profile (Supabase Auth stays the source of truth).
  CREATE OR REPLACE FUNCTION public.handle_auth_user_email_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $fn$
  BEGIN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
    RETURN NEW;
  END;
  $fn$;

  REVOKE ALL ON FUNCTION public.handle_auth_user_email_change() FROM PUBLIC, anon, authenticated;

  DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
  CREATE TRIGGER on_auth_user_email_changed
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION public.handle_auth_user_email_change();

  -- 4d. Deletion trigger.
  CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $fn$
  BEGIN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
  END;
  $fn$;

  REVOKE ALL ON FUNCTION public.handle_deleted_auth_user() FROM PUBLIC, anon, authenticated;

  DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
  CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_auth_user();

  -- The updated_at trigger function is not meant to be called through the Data API.
  REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

  -- 4e. Backfill rows for users who signed up before this migration (role is always 'patient').
  INSERT INTO public.profiles (id, email, full_name, role)
  SELECT u.id,
         u.email,
         left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), 100),
         'patient'::public.user_role
  FROM auth.users u
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_settings (user_id)
  SELECT u.id FROM auth.users u
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.emergency_profiles (patient_id)
  SELECT u.id FROM auth.users u
  ON CONFLICT (patient_id) DO NOTHING;

  -- 4f. Table privileges for the Data API roles (RLS policies below further restrict rows).
  --     Supabase grants ALL on new public tables to anon/authenticated by default, so revoke first
  --     and grant back only what is needed, column by column where it matters.
  REVOKE ALL ON public.profiles, public.emergency_profiles, public.user_settings,
                public.facilities, public.practitioners, public.appointments,
                public.medical_records, public.queue_tickets
    FROM anon, authenticated;
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    REVOKE ALL ON public._prisma_migrations FROM anon, authenticated;
  END IF;

  GRANT SELECT ON public.facilities TO anon, authenticated;
  -- practitioners: directory columns only. profile_id (login link) and license_number stay private;
  -- Data API clients must select these columns explicitly (select=* is denied).
  GRANT SELECT (id, full_name, specialty, facility_id, created_at, updated_at)
    ON public.practitioners TO anon, authenticated;

  -- profiles: read own row; update only name and phone (no email/role self-escalation); no insert/delete.
  GRANT SELECT ON public.profiles TO authenticated;
  GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

  -- emergency_profiles / user_settings: one row per user, created by the signup trigger.
  -- Patients may read and edit their row (insert only if it is missing) but never delete it.
  GRANT SELECT ON public.emergency_profiles, public.user_settings TO authenticated;
  GRANT INSERT (patient_id, blood_type, allergies, conditions, emergency_contact_name, emergency_contact_phone)
    ON public.emergency_profiles TO authenticated;
  GRANT UPDATE (blood_type, allergies, conditions, emergency_contact_name, emergency_contact_phone)
    ON public.emergency_profiles TO authenticated;
  GRANT INSERT (user_id, language, theme, notifications_enabled, show_emergency_qr)
    ON public.user_settings TO authenticated;
  GRANT UPDATE (language, theme, notifications_enabled, show_emergency_qr)
    ON public.user_settings TO authenticated;

  -- medical_records: patient-written (see header). Content columns only; delete allowed.
  GRANT SELECT, DELETE ON public.medical_records TO authenticated;
  GRANT INSERT (patient_id, title, category, provider, recorded_on, notes)
    ON public.medical_records TO authenticated;
  GRANT UPDATE (title, category, provider, recorded_on, notes)
    ON public.medical_records TO authenticated;

  -- appointments / queue_tickets: read own rows only. Booking, status changes and ticket numbering
  -- go through the Next.js API so patients cannot confirm their own appointment or jump the queue.
  GRANT SELECT ON public.appointments, public.queue_tickets TO authenticated;

  -- 4g. Policies. (select auth.uid()) is evaluated once per statement (Supabase performance advice).
  -- profiles
  DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
  CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
  DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
  CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

  -- emergency_profiles (no delete policy)
  DROP POLICY IF EXISTS emergency_profiles_select_own ON public.emergency_profiles;
  CREATE POLICY emergency_profiles_select_own ON public.emergency_profiles
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = patient_id);
  DROP POLICY IF EXISTS emergency_profiles_insert_own ON public.emergency_profiles;
  CREATE POLICY emergency_profiles_insert_own ON public.emergency_profiles
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = patient_id);
  DROP POLICY IF EXISTS emergency_profiles_update_own ON public.emergency_profiles;
  CREATE POLICY emergency_profiles_update_own ON public.emergency_profiles
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = patient_id) WITH CHECK ((SELECT auth.uid()) = patient_id);

  -- user_settings (no delete policy)
  DROP POLICY IF EXISTS user_settings_select_own ON public.user_settings;
  CREATE POLICY user_settings_select_own ON public.user_settings
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
  DROP POLICY IF EXISTS user_settings_insert_own ON public.user_settings;
  CREATE POLICY user_settings_insert_own ON public.user_settings
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
  DROP POLICY IF EXISTS user_settings_update_own ON public.user_settings;
  CREATE POLICY user_settings_update_own ON public.user_settings
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

  -- appointments (read-only through the Data API)
  DROP POLICY IF EXISTS appointments_select_own ON public.appointments;
  CREATE POLICY appointments_select_own ON public.appointments
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = patient_id);

  -- medical_records
  DROP POLICY IF EXISTS medical_records_select_own ON public.medical_records;
  CREATE POLICY medical_records_select_own ON public.medical_records
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = patient_id);
  DROP POLICY IF EXISTS medical_records_insert_own ON public.medical_records;
  CREATE POLICY medical_records_insert_own ON public.medical_records
    FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = patient_id);
  DROP POLICY IF EXISTS medical_records_update_own ON public.medical_records;
  CREATE POLICY medical_records_update_own ON public.medical_records
    FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = patient_id) WITH CHECK ((SELECT auth.uid()) = patient_id);
  DROP POLICY IF EXISTS medical_records_delete_own ON public.medical_records;
  CREATE POLICY medical_records_delete_own ON public.medical_records
    FOR DELETE TO authenticated USING ((SELECT auth.uid()) = patient_id);

  -- queue_tickets (read-only through the Data API)
  DROP POLICY IF EXISTS queue_tickets_select_own ON public.queue_tickets;
  CREATE POLICY queue_tickets_select_own ON public.queue_tickets
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = patient_id);

  -- facilities / practitioners: public read, no writes through the Data API.
  DROP POLICY IF EXISTS facilities_public_read ON public.facilities;
  CREATE POLICY facilities_public_read ON public.facilities
    FOR SELECT TO anon, authenticated USING (true);
  DROP POLICY IF EXISTS practitioners_public_read ON public.practitioners;
  CREATE POLICY practitioners_public_read ON public.practitioners
    FOR SELECT TO anon, authenticated USING (true);
END
$migration$;
