-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('patient', 'doctor', 'pharmacy', 'hospital', 'admin');

-- CreateEnum
CREATE TYPE "facility_type" AS ENUM ('hospital', 'clinic', 'community_health_centre', 'pharmacy');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "queue_ticket_status" AS ENUM ('waiting', 'called', 'served', 'cancelled');

-- CreateEnum
CREATE TYPE "app_language" AS ENUM ('en', 'zu', 'af', 'st');

-- CreateEnum
CREATE TYPE "app_theme" AS ENUM ('system', 'light', 'dark');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100) NOT NULL DEFAULT '',
    "email" VARCHAR(254),
    "phone" VARCHAR(32),
    "role" "user_role" NOT NULL DEFAULT 'patient',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_profiles" (
    "patient_id" UUID NOT NULL,
    "blood_type" VARCHAR(20),
    "allergies" VARCHAR(250),
    "conditions" VARCHAR(250),
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_profiles_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "user_id" UUID NOT NULL,
    "language" "app_language" NOT NULL DEFAULT 'en',
    "theme" "app_theme" NOT NULL DEFAULT 'system',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_emergency_qr" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "type" "facility_type" NOT NULL,
    "province" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" VARCHAR(250),
    "phone" VARCHAR(32),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practitioners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID,
    "full_name" VARCHAR(100) NOT NULL,
    "specialty" VARCHAR(100) NOT NULL,
    "facility_id" UUID,
    "license_number" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practitioners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "practitioner_id" UUID,
    "practitioner_name" VARCHAR(100) NOT NULL,
    "specialty" VARCHAR(100) NOT NULL,
    "facility_id" UUID,
    "facility_name" VARCHAR(150) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(500),
    "status" "appointment_status" NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "provider" VARCHAR(150),
    "recorded_on" DATE NOT NULL,
    "notes" VARCHAR(2000),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "service_date" DATE NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "status" "queue_ticket_status" NOT NULL DEFAULT 'waiting',
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_wait_min" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profiles_role_idx" ON "profiles"("role");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "facilities_type_idx" ON "facilities"("type");

-- CreateIndex
CREATE INDEX "facilities_province_idx" ON "facilities"("province");

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_profile_id_key" ON "practitioners"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "practitioners_license_number_key" ON "practitioners"("license_number");

-- CreateIndex
CREATE INDEX "practitioners_facility_id_idx" ON "practitioners"("facility_id");

-- CreateIndex
CREATE INDEX "practitioners_specialty_idx" ON "practitioners"("specialty");

-- CreateIndex
CREATE INDEX "appointments_patient_id_scheduled_at_idx" ON "appointments"("patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_practitioner_id_idx" ON "appointments"("practitioner_id");

-- CreateIndex
CREATE INDEX "appointments_facility_id_idx" ON "appointments"("facility_id");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_recorded_on_idx" ON "medical_records"("patient_id", "recorded_on");

-- CreateIndex
CREATE INDEX "queue_tickets_patient_id_status_idx" ON "queue_tickets"("patient_id", "status");

-- CreateIndex
CREATE INDEX "queue_tickets_facility_id_service_date_status_idx" ON "queue_tickets"("facility_id", "service_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "queue_tickets_facility_id_service_date_ticket_number_key" ON "queue_tickets"("facility_id", "service_date", "ticket_number");

-- AddForeignKey
ALTER TABLE "emergency_profiles" ADD CONSTRAINT "emergency_profiles_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practitioners" ADD CONSTRAINT "practitioners_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_tickets" ADD CONSTRAINT "queue_tickets_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

