CREATE TABLE "access_control" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"requester_id" varchar NOT NULL,
	"record_id" varchar,
	"access_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"is_emergency" boolean DEFAULT false,
	"proof_image" text,
	"proof_details" text,
	"hospital_notified" boolean DEFAULT false,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"expires_at" timestamp,
	"encrypted_key" text
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"target_id" varchar,
	"target_type" text,
	"metadata" jsonb,
	"ip_address" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_number" text NOT NULL,
	"patient_id" varchar NOT NULL,
	"treatment_log_id" varchar,
	"hospital_id" varchar NOT NULL,
	"connection_id" varchar NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"claim_type" text NOT NULL,
	"treatment_description" text,
	"invoice_cid" text NOT NULL,
	"invoice_signature" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"patient_note" text,
	"rejection_reason" text,
	"paid_at" timestamp,
	"paid_amount" numeric(12, 2),
	CONSTRAINT "claims_claim_number_unique" UNIQUE("claim_number")
);
--> statement-breakpoint
CREATE TABLE "consultation_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"hospital_name" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "emergency_qr_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"qr_data" text NOT NULL,
	"signed_token" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"scan_count" integer DEFAULT 0,
	CONSTRAINT "emergency_qr_codes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "health_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"blood_type" text,
	"allergies" text[],
	"chronic_conditions" text[],
	"current_medications" text[],
	"emergency_contact" text,
	"emergency_phone" text,
	"height" numeric,
	"weight" numeric,
	"organ_donor" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "insurance_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider_name" text NOT NULL,
	"description" text,
	"monthly_fee" numeric(10, 2) NOT NULL,
	"coverage_limit" numeric(12, 2),
	"coverage_types" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_providers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "kyc" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" text,
	"national_id" text,
	"phone_number" text,
	"address" text,
	"document_type" text,
	"document_number" text,
	"document_cid" text,
	"professional_license" text,
	"institution_name" text,
	"selected_hospital" text,
	"country" text,
	"state" text,
	"location" text,
	"hospital_profile" text,
	"requested_role" text,
	"provider_name" text,
	"provider_description" text,
	"monthly_fee" numeric(10, 2),
	"coverage_limit" numeric(12, 2),
	"coverage_types" text[],
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"record_type" text NOT NULL,
	"file_cid" text NOT NULL,
	"file_hash" text NOT NULL,
	"file_name" text,
	"file_type" text,
	"file_data" text,
	"is_emergency" boolean DEFAULT false,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"encryption_key" text
);
--> statement-breakpoint
CREATE TABLE "patient_admissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"hospital_id" varchar NOT NULL,
	"doctor_id" varchar,
	"admitted_by_id" varchar,
	"discharged_by_id" varchar,
	"admission_date" timestamp DEFAULT now() NOT NULL,
	"discharge_date" timestamp,
	"admission_reason" text,
	"discharge_notes" text,
	"status" text DEFAULT 'admitted' NOT NULL,
	"room_number" text,
	"ward" text
);
--> statement-breakpoint
CREATE TABLE "patient_insurance_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"connection_reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"disconnected_at" timestamp,
	"last_billing_date" timestamp,
	"missed_payments_count" integer DEFAULT 0,
	"reviewed_by" varchar,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "treatment_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"hospital_id" varchar,
	"diagnosis" text NOT NULL,
	"treatment" text NOT NULL,
	"prescription" text,
	"notes" text,
	"treatment_date" timestamp NOT NULL,
	"record_cid" text,
	"doctor_signature" text NOT NULL,
	"signature_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"uid" text NOT NULL,
	"username" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'patient' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"profile_picture" text,
	"hospital_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_uid_unique" UNIQUE("uid"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "access_control" ADD CONSTRAINT "access_control_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_control" ADD CONSTRAINT "access_control_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_control" ADD CONSTRAINT "access_control_record_id_medical_records_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."medical_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_consultation_id_consultation_requests_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_treatment_log_id_treatment_logs_id_fk" FOREIGN KEY ("treatment_log_id") REFERENCES "public"."treatment_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_hospital_id_users_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_connection_id_patient_insurance_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."patient_insurance_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_requests" ADD CONSTRAINT "consultation_requests_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_qr_codes" ADD CONSTRAINT "emergency_qr_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_providers" ADD CONSTRAINT "insurance_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_admissions" ADD CONSTRAINT "patient_admissions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_admissions" ADD CONSTRAINT "patient_admissions_hospital_id_users_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_admissions" ADD CONSTRAINT "patient_admissions_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_admissions" ADD CONSTRAINT "patient_admissions_admitted_by_id_users_id_fk" FOREIGN KEY ("admitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_admissions" ADD CONSTRAINT "patient_admissions_discharged_by_id_users_id_fk" FOREIGN KEY ("discharged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance_connections" ADD CONSTRAINT "patient_insurance_connections_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance_connections" ADD CONSTRAINT "patient_insurance_connections_provider_id_insurance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."insurance_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_insurance_connections" ADD CONSTRAINT "patient_insurance_connections_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_logs" ADD CONSTRAINT "treatment_logs_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_logs" ADD CONSTRAINT "treatment_logs_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_logs" ADD CONSTRAINT "treatment_logs_hospital_id_users_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_patient_idx" ON "access_control" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "access_requester_idx" ON "access_control" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "messages_consultation_idx" ON "chat_messages" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "claims_patient_idx" ON "claims" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consultation_patient_idx" ON "consultation_requests" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consultation_doctor_idx" ON "consultation_requests" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "medical_records_user_idx" ON "medical_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admissions_patient_idx" ON "patient_admissions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "admissions_hospital_idx" ON "patient_admissions" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "admissions_status_idx" ON "patient_admissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admissions_doctor_idx" ON "patient_admissions" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "connection_patient_idx" ON "patient_insurance_connections" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "connection_provider_idx" ON "patient_insurance_connections" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "treatment_patient_idx" ON "treatment_logs" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "wallet_idx" ON "users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "uid_idx" ON "users" USING btree ("uid");