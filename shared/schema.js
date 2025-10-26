import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
// Users table - stores wallet addresses and basic info
export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    walletAddress: text("wallet_address").notNull().unique(),
    uid: text("uid").notNull().unique(), // Blockchain-style UID
    username: text("username").notNull().unique(),
    email: text("email"),
    role: text("role").notNull().default("patient"), // patient, doctor, hospital, emergency_responder, insurance_provider, admin
    status: text("status").notNull().default("pending"), // pending, verified, suspended
    profilePicture: text("profile_picture"),
    hospitalName: text("hospital_name"), // Hospital name for hospitals, or affiliated hospital for doctors/emergency responders
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    walletIdx: index("wallet_idx").on(table.walletAddress),
    uidIdx: index("uid_idx").on(table.uid),
}));
// KYC data - encrypted and stored per user
export const kyc = pgTable("kyc", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    dateOfBirth: text("date_of_birth"),
    nationalId: text("national_id"),
    phoneNumber: text("phone_number"),
    address: text("address"),
    documentType: text("document_type"), // passport, national_id, drivers_license
    documentNumber: text("document_number"),
    documentCID: text("document_cid"), // IPFS CID (simulated)
    professionalLicense: text("professional_license"), // For doctors/hospitals
    institutionName: text("institution_name"), // For hospitals/insurance
    selectedHospital: text("selected_hospital"), // Hospital selection for patients/doctors
    country: text("country"), // For hospital applications
    state: text("state"), // For hospital applications
    location: text("location"), // For hospital applications (address/location)
    hospitalProfile: text("hospital_profile"), // For hospital applications (description/details)
    requestedRole: text("requested_role"), // For role applications: doctor, hospital, emergency_responder, insurance_provider
    providerName: text("provider_name"), // For insurance provider applications
    providerDescription: text("provider_description"), // For insurance provider applications
    monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }), // For insurance provider applications
    coverageLimit: decimal("coverage_limit", { precision: 12, scale: 2 }), // For insurance provider applications
    coverageTypes: text("coverage_types").array(), // For insurance provider applications
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: varchar("reviewed_by").references(() => users.id),
    status: text("status").notNull().default("pending"), // pending, approved, rejected
    rejectionReason: text("rejection_reason"),
});
// Patient health profiles
export const healthProfiles = pgTable("health_profiles", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    bloodType: text("blood_type"), // A+, A-, B+, B-, AB+, AB-, O+, O-
    allergies: text("allergies").array(),
    chronicConditions: text("chronic_conditions").array(),
    currentMedications: text("current_medications").array(),
    emergencyContact: text("emergency_contact"),
    emergencyPhone: text("emergency_phone"),
    height: decimal("height"), // in cm
    weight: decimal("weight"), // in kg
    organDonor: boolean("organ_donor").default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Medical records - encrypted files stored on IPFS
export const medicalRecords = pgTable("medical_records", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    recordType: text("record_type").notNull(), // lab_report, prescription, imaging, diagnosis, treatment_plan
    fileCID: text("file_cid").notNull(), // IPFS CID (simulated)
    fileHash: text("file_hash").notNull(), // SHA-256 hash for integrity
    fileName: text("file_name"), // Original file name
    fileType: text("file_type"), // MIME type (application/pdf, etc.)
    fileData: text("file_data"), // Base64 encoded file data
    isEmergency: boolean("is_emergency").default(false), // Flag for emergency access
    uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
    uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
    encryptionKey: text("encryption_key"), // Wrapped AES key (simulated)
}, (table) => ({
    userIdx: index("medical_records_user_idx").on(table.userId),
}));
// Access control - who can access which records
export const accessControl = pgTable("access_control", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recordId: varchar("record_id").references(() => medicalRecords.id, { onDelete: "cascade" }),
    accessType: text("access_type").notNull(), // full, emergency_only, specific_record
    status: text("status").notNull().default("pending"), // pending, granted, revoked, expired
    reason: text("reason"),
    isEmergency: boolean("is_emergency").default(false), // Flag for emergency access requests
    proofImage: text("proof_image"), // Base64 encoded proof image for emergency requests
    proofDetails: text("proof_details"), // Additional details/context for the request
    hospitalNotified: boolean("hospital_notified").default(false), // Whether patient's hospital was notified
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
    expiresAt: timestamp("expires_at"),
    encryptedKey: text("encrypted_key"), // ECIES-wrapped key for this requester
}, (table) => ({
    patientIdx: index("access_patient_idx").on(table.patientId),
    requesterIdx: index("access_requester_idx").on(table.requesterId),
}));
// Treatment logs - signed by doctors
export const treatmentLogs = pgTable("treatment_logs", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    hospitalId: varchar("hospital_id").references(() => users.id),
    diagnosis: text("diagnosis").notNull(),
    treatment: text("treatment").notNull(),
    prescription: text("prescription"),
    notes: text("notes"),
    treatmentDate: timestamp("treatment_date").notNull(),
    recordCID: text("record_cid"), // IPFS CID for full record
    doctorSignature: text("doctor_signature").notNull(), // EIP-712 signature
    signatureHash: text("signature_hash").notNull(),
    treatmentFiles: jsonb("treatment_files"), // Array of file objects with {name, type, data (base64)}
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    patientIdx: index("treatment_patient_idx").on(table.patientId),
}));
// Insurance providers (companies)
export const insuranceProviders = pgTable("insurance_providers", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    providerName: text("provider_name").notNull(),
    description: text("description"),
    monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).notNull(),
    coverageLimit: decimal("coverage_limit", { precision: 12, scale: 2 }),
    coverageTypes: text("coverage_types").array(), // emergency, outpatient, inpatient, surgery
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});
// Patient insurance connections (replaces enrollment and applications)
export const patientInsuranceConnections = pgTable("patient_insurance_connections", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id").notNull().references(() => insuranceProviders.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending, connected, disconnected
    connectionReason: text("connection_reason"),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    approvedAt: timestamp("approved_at"),
    disconnectedAt: timestamp("disconnected_at"),
    lastBillingDate: timestamp("last_billing_date"),
    missedPaymentsCount: integer("missed_payments_count").default(0),
    reviewedBy: varchar("reviewed_by").references(() => users.id),
    rejectionReason: text("rejection_reason"),
}, (table) => ({
    patientIdx: index("connection_patient_idx").on(table.patientId),
    providerIdx: index("connection_provider_idx").on(table.providerId),
}));
// Insurance claims (simplified workflow)
export const claims = pgTable("claims", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    claimNumber: text("claim_number").notNull().unique(),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    treatmentLogId: varchar("treatment_log_id").references(() => treatmentLogs.id),
    hospitalId: varchar("hospital_id").notNull().references(() => users.id),
    connectionId: varchar("connection_id").notNull().references(() => patientInsuranceConnections.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    claimType: text("claim_type").notNull(), // emergency, outpatient, inpatient, surgery
    treatmentDescription: text("treatment_description"),
    invoiceCID: text("invoice_cid").notNull(),
    invoiceSignature: text("invoice_signature").notNull(),
    status: text("status").notNull().default("pending"), // pending, approved, rejected, paid
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
    patientNote: text("patient_note"),
    rejectionReason: text("rejection_reason"),
    paidAt: timestamp("paid_at"),
    paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }),
}, (table) => ({
    patientIdx: index("claims_patient_idx").on(table.patientId),
    statusIdx: index("claims_status_idx").on(table.status),
}));
// Audit log - immutable record of all actions
export const auditLogs = pgTable("audit_logs", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    action: text("action").notNull(), // access_requested, access_granted, access_revoked, record_added, claim_submitted, claim_approved, etc.
    targetId: varchar("target_id"), // ID of affected resource
    targetType: text("target_type"), // user, record, claim, access
    metadata: jsonb("metadata"), // Additional context
    ipAddress: text("ip_address"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("audit_user_idx").on(table.userId),
    timestampIdx: index("audit_timestamp_idx").on(table.timestamp),
}));
// Emergency QR codes
export const emergencyQRCodes = pgTable("emergency_qr_codes", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
    qrData: text("qr_data").notNull(), // JSON payload with emergency info
    signedToken: text("signed_token").notNull(), // EIP-712 signature
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    scanCount: integer("scan_count").default(0),
});
// Consultation requests - patients request consultation from doctors
export const consultationRequests = pgTable("consultation_requests", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    doctorId: varchar("doctor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    hospitalName: text("hospital_name").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"), // pending, accepted, rejected
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
    rejectionReason: text("rejection_reason"),
}, (table) => ({
    patientIdx: index("consultation_patient_idx").on(table.patientId),
    doctorIdx: index("consultation_doctor_idx").on(table.doctorId),
}));
// Chat messages - for consultation between patients and doctors
export const chatMessages = pgTable("chat_messages", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    consultationId: varchar("consultation_id").notNull().references(() => consultationRequests.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
}, (table) => ({
    consultationIdx: index("messages_consultation_idx").on(table.consultationId),
    senderIdx: index("messages_sender_idx").on(table.senderId),
}));
// Patient admissions - track current hospital admissions and discharges
export const patientAdmissions = pgTable("patient_admissions", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    patientId: varchar("patient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    hospitalId: varchar("hospital_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    doctorId: varchar("doctor_id").references(() => users.id), // Doctor assigned to treat this patient
    admittedById: varchar("admitted_by_id").references(() => users.id), // Doctor or hospital staff who admitted
    dischargedById: varchar("discharged_by_id").references(() => users.id), // Doctor or hospital staff who discharged
    admissionDate: timestamp("admission_date").notNull().defaultNow(),
    dischargeDate: timestamp("discharge_date"),
    admissionReason: text("admission_reason"),
    dischargeNotes: text("discharge_notes"),
    status: text("status").notNull().default("admitted"), // admitted, discharged, treated
    roomNumber: text("room_number"),
    ward: text("ward"),
}, (table) => ({
    patientIdx: index("admissions_patient_idx").on(table.patientId),
    hospitalIdx: index("admissions_hospital_idx").on(table.hospitalId),
    statusIdx: index("admissions_status_idx").on(table.status),
    doctorIdx: index("admissions_doctor_idx").on(table.doctorId),
}));
// Subscription payments - tracks 20 BDAG annual subscription for hospitals & insurance providers
export const subscriptionPayments = pgTable("subscription_payments", {
    id: varchar("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kycId: varchar("kyc_id").references(() => kyc.id),
    role: text("role").notNull(), // hospital or insurance_provider
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // 20 BDAG
    transactionHash: text("transaction_hash").notNull().unique(),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address").notNull(), // Admin wallet address
    status: text("status").notNull().default("pending"), // pending, confirmed, failed
    paidAt: timestamp("paid_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(), // One year from payment
}, (table) => ({
    userIdx: index("subscription_user_idx").on(table.userId),
    txHashIdx: index("subscription_tx_idx").on(table.transactionHash),
}));
// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
    kyc: one(kyc, {
        fields: [users.id],
        references: [kyc.userId],
    }),
    healthProfile: one(healthProfiles, {
        fields: [users.id],
        references: [healthProfiles.userId],
    }),
    medicalRecords: many(medicalRecords),
    accessGranted: many(accessControl, { relationName: "requester" }),
    accessReceived: many(accessControl, { relationName: "patient" }),
    treatmentsAsPatient: many(treatmentLogs, { relationName: "patient" }),
    treatmentsAsDoctor: many(treatmentLogs, { relationName: "doctor" }),
    claimsAsPatient: many(claims, { relationName: "claimPatient" }),
    insuranceConnections: many(patientInsuranceConnections),
    insuranceProvider: one(insuranceProviders, {
        fields: [users.id],
        references: [insuranceProviders.userId],
    }),
    auditLogs: many(auditLogs),
    emergencyQR: one(emergencyQRCodes, {
        fields: [users.id],
        references: [emergencyQRCodes.userId],
    }),
}));
// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertKYCSchema = createInsertSchema(kyc).omit({ id: true, submittedAt: true, reviewedAt: true, reviewedBy: true });
export const insertHealthProfileSchema = createInsertSchema(healthProfiles).omit({ id: true, updatedAt: true });
export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true, uploadedAt: true });
export const insertAccessControlSchema = createInsertSchema(accessControl).omit({ id: true, requestedAt: true, respondedAt: true });
export const insertTreatmentLogSchema = createInsertSchema(treatmentLogs).omit({ id: true, createdAt: true });
export const insertInsuranceProviderSchema = createInsertSchema(insuranceProviders).omit({ id: true, createdAt: true });
export const insertPatientInsuranceConnectionSchema = createInsertSchema(patientInsuranceConnections).omit({ id: true, requestedAt: true, approvedAt: true, disconnectedAt: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, submittedAt: true, respondedAt: true, paidAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export const insertEmergencyQRSchema = createInsertSchema(emergencyQRCodes).omit({ id: true, generatedAt: true });
export const insertConsultationRequestSchema = createInsertSchema(consultationRequests).omit({ id: true, requestedAt: true, respondedAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, sentAt: true });
export const insertPatientAdmissionSchema = createInsertSchema(patientAdmissions).omit({ id: true, admissionDate: true, dischargeDate: true });
export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).omit({ id: true, paidAt: true });
