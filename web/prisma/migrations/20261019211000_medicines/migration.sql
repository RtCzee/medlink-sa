-- CreateTable
CREATE TABLE "medicines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "generic_name" VARCHAR(150),
    "strength" VARCHAR(50),
    "form" VARCHAR(50),
    "category" VARCHAR(80),
    "requires_prescription" BOOLEAN NOT NULL DEFAULT false,
    "source" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicine_id" UUID NOT NULL,
    "pharmacy_name" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'ZAR',
    "effective_from" DATE NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicines_name_idx" ON "medicines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_name_strength_key" ON "medicines"("name", "strength");

-- CreateIndex
CREATE INDEX "medicine_prices_medicine_id_effective_from_idx" ON "medicine_prices"("medicine_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_prices_medicine_id_pharmacy_name_effective_from_key" ON "medicine_prices"("medicine_id", "pharmacy_name", "effective_from");

-- AddForeignKey
ALTER TABLE "medicine_prices" ADD CONSTRAINT "medicine_prices_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- â”€â”€â”€ Hand-written part: integrity, updated_at trigger, RLS, Data API grants, demo seed â”€â”€â”€
-- Additive only: creates rules for the two new tables and inserts demo rows into them.
--
-- Access model: a PUBLIC directory, like facilities. anon and authenticated may SELECT
-- active medicines and the prices of active medicines; nobody may write through the
-- Data API. The Next.js API (Prisma, table owner, bypasses RLS) filters active = true
-- in code.

-- 1. Enable RLS (works on any PostgreSQL; the table owner is not affected).
ALTER TABLE "public"."medicines"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."medicine_prices" ENABLE ROW LEVEL SECURITY;

-- 2. Data integrity rules that Prisma 6 cannot express in schema.prisma.
ALTER TABLE "public"."medicine_prices"
  ADD CONSTRAINT "medicine_prices_amount_check" CHECK ("amount" >= 0),
  ADD CONSTRAINT "medicine_prices_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

-- 3. updated_at is set by the database on UPDATE (function from supabase_auth_rls).
--    medicine_prices has no updated_at: a price change is a new row with a new effective_from.
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Supabase-only grants and policies (skipped with a NOTICE on plain PostgreSQL, e.g. CI).
DO $migration$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    RAISE NOTICE 'Supabase roles not found: skipping medicine grants and RLS policies.';
    RETURN;
  END IF;

  REVOKE ALL ON public.medicines, public.medicine_prices FROM anon, authenticated;
  GRANT SELECT ON public.medicines, public.medicine_prices TO anon, authenticated;

  DROP POLICY IF EXISTS medicines_public_read_active ON public.medicines;
  CREATE POLICY medicines_public_read_active ON public.medicines
    FOR SELECT TO anon, authenticated USING (active);

  DROP POLICY IF EXISTS medicine_prices_public_read_active ON public.medicine_prices;
  CREATE POLICY medicine_prices_public_read_active ON public.medicine_prices
    FOR SELECT TO anon, authenticated USING (
      EXISTS (SELECT 1 FROM public.medicines m WHERE m.id = medicine_prices.medicine_id AND m.active)
    );
END
$migration$;

-- 5. Demo seed: the products in web/src/lib/data.ts (MEDICINES), values copied as-is.
--    Not copied: pack, schedule, stock, delivery and distance (no columns; stock and
--    availability are not modelled). Prices are illustrative demo values, not current.
--    Idempotent (ON CONFLICT DO NOTHING on the unique keys).
INSERT INTO "public"."medicines" ("name", "generic_name", "strength", "form", "category", "requires_prescription", "source")
VALUES
  ('Panado', 'Paracetamol', '500mg', 'Tablet', 'Pain & fever', false, 'demo'),
  ('Augmentin', 'Amoxicillin + Clavulanic acid', '875mg/125mg', 'Tablet', 'Antibiotic', true, 'demo'),
  ('Glucophage', 'Metformin', '850mg', 'Tablet', 'Diabetes', true, 'demo'),
  ('Ventolin', 'Salbutamol', '100mcg', 'Inhaler', 'Asthma', true, 'demo'),
  ('Allergex', 'Chlorphenamine', '4mg', 'Tablet', 'Allergy', false, 'demo'),
  ('Brufen', 'Ibuprofen', '400mg', 'Tablet', 'Pain & inflammation', false, 'demo')
ON CONFLICT ("name", "strength") DO NOTHING;

INSERT INTO "public"."medicine_prices" ("medicine_id", "pharmacy_name", "amount", "currency", "effective_from", "source")
SELECT m."id", v.pharmacy_name, v.amount, 'ZAR', DATE '2026-10-19', 'demo'
FROM (VALUES
  ('Panado', '500mg', 'Clicks', 24.99),
  ('Panado', '500mg', 'Dis-Chem', 22.50),
  ('Panado', '500mg', 'Rosebank Pharmacy', 27.00),
  ('Panado', '500mg', 'Pick n Pay Pharmacy', 19.99),
  ('Augmentin', '875mg/125mg', 'Clicks', 189.99),
  ('Augmentin', '875mg/125mg', 'Dis-Chem', 174.50),
  ('Augmentin', '875mg/125mg', 'Rosebank Pharmacy', 205.00),
  ('Glucophage', '850mg', 'Clicks', 89.99),
  ('Glucophage', '850mg', 'Dis-Chem', 79.00),
  ('Glucophage', '850mg', 'Pick n Pay Pharmacy', 75.50),
  ('Ventolin', '100mcg', 'Clicks', 129.99),
  ('Ventolin', '100mcg', 'Dis-Chem', 119.00),
  ('Ventolin', '100mcg', 'Rosebank Pharmacy', 135.00),
  ('Allergex', '4mg', 'Clicks', 34.99),
  ('Allergex', '4mg', 'Dis-Chem', 29.50),
  ('Allergex', '4mg', 'Pick n Pay Pharmacy', 32.00),
  ('Brufen', '400mg', 'Clicks', 39.99),
  ('Brufen', '400mg', 'Dis-Chem', 35.00),
  ('Brufen', '400mg', 'Rosebank Pharmacy', 42.00)
) AS v(name, strength, pharmacy_name, amount)
JOIN "public"."medicines" m ON m."name" = v.name AND m."strength" = v.strength
ON CONFLICT ("medicine_id", "pharmacy_name", "effective_from") DO NOTHING;
