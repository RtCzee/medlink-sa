-- CreateEnum
CREATE TYPE "prescription_status" AS ENUM ('active', 'completed', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "practitioner_id" UUID,
    "appointment_id" UUID,
    "facility_id" UUID,
    "status" "prescription_status" NOT NULL DEFAULT 'active',
    "issued_on" DATE NOT NULL,
    "expires_on" DATE,
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prescription_id" UUID NOT NULL,
    "medicine_name" VARCHAR(150) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "quantity" INTEGER,
    "instructions" VARCHAR(500),
    "refills" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_issued_on_idx" ON "prescriptions"("patient_id", "issued_on");

-- CreateIndex
CREATE INDEX "prescriptions_practitioner_id_idx" ON "prescriptions"("practitioner_id");

-- CreateIndex
CREATE INDEX "prescriptions_appointment_id_idx" ON "prescriptions"("appointment_id");

-- CreateIndex
CREATE INDEX "prescriptions_facility_id_idx" ON "prescriptions"("facility_id");

-- CreateIndex
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items"("prescription_id");

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- â”€â”€â”€ Hand-written part: data integrity, updated_at triggers, Data API grants and RLS â”€â”€â”€
-- Additive only: creates the prescription tables' rules; touches no existing table or row.
--
-- Access model (same as supabase_auth_rls):
--   * The Next.js API connects through Prisma as the table owner (bypasses RLS) and must scope
--     every query to the signed-in patient in code.
--   * RLS is defence in depth for the Supabase Data API. Patients may only READ their own
--     prescriptions, and the items of their own prescriptions (through the parent row).
--   * There is NO insert/update/delete grant or policy for anyone: there is no verified
--     prescriber model yet, so prescriptions can only be written by the table owner
--     (migrations, SQL editor, a future reviewed prescriber workflow).

-- 1. Enable RLS (works on any PostgreSQL; the table owner is not affected).
ALTER TABLE "public"."prescriptions"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prescription_items" ENABLE ROW LEVEL SECURITY;

-- 2. Data integrity rules that Prisma 6 cannot express in schema.prisma.
ALTER TABLE "public"."prescriptions"
  ADD CONSTRAINT "prescriptions_expires_on_check" CHECK ("expires_on" IS NULL OR "expires_on" >= "issued_on");
ALTER TABLE "public"."prescription_items"
  ADD CONSTRAINT "prescription_items_quantity_check" CHECK ("quantity" IS NULL OR "quantity" > 0),
  ADD CONSTRAINT "prescription_items_refills_check" CHECK ("refills" >= 0);

-- 3. updated_at is set by the database on UPDATE (function from supabase_auth_rls).
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prescription_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Supabase-only grants and policies (skipped with a NOTICE on plain PostgreSQL, e.g. CI).
DO $migration$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'Supabase auth schema/roles not found: skipping prescription grants and RLS policies.';
    RETURN;
  END IF;

  -- Supabase grants ALL on new public tables to anon/authenticated by default: revoke, then
  -- grant back read-only access for signed-in users. anon gets nothing.
  REVOKE ALL ON public.prescriptions, public.prescription_items FROM anon, authenticated;
  GRANT SELECT ON public.prescriptions, public.prescription_items TO authenticated;

  DROP POLICY IF EXISTS prescriptions_select_own ON public.prescriptions;
  CREATE POLICY prescriptions_select_own ON public.prescriptions
    FOR SELECT TO authenticated USING ((SELECT auth.uid()) = patient_id);

  -- Items are visible only through a prescription the caller owns.
  DROP POLICY IF EXISTS prescription_items_select_own ON public.prescription_items;
  CREATE POLICY prescription_items_select_own ON public.prescription_items
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.prescriptions p
        WHERE p.id = prescription_items.prescription_id
          AND p.patient_id = (SELECT auth.uid())
      )
    );
END
$migration$;
