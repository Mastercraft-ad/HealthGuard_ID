import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import type {
  User, InsertUser,
  KYC, InsertKYC,
  HealthProfile, InsertHealthProfile,
  MedicalRecord, InsertMedicalRecord,
  AccessControl, InsertAccessControl,
  TreatmentLog, InsertTreatmentLog,
  InsuranceProvider, InsertInsuranceProvider,
  PatientInsuranceConnection, InsertPatientInsuranceConnection,
  Claim, InsertClaim,
  AuditLog, InsertAuditLog,
  EmergencyQR, InsertEmergencyQR,
  ConsultationRequest, InsertConsultationRequest,
  ChatMessage, InsertChatMessage,
  PatientAdmission, InsertPatientAdmission,
  SubscriptionPayment, InsertSubscriptionPayment,
} from "@shared/schema";
import {
  users,
  kyc,
  healthProfiles,
  medicalRecords,
  accessControl,
  treatmentLogs,
  insuranceProviders,
  patientInsuranceConnections,
  claims,
  auditLogs,
  emergencyQRCodes,
  consultationRequests,
  chatMessages,
  patientAdmissions,
  subscriptionPayments,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: string, status: string): Promise<void>;
  updateUserRole(id: string, role: string): Promise<void>;
  updateUserProfilePicture(id: string, profilePicture: string): Promise<void>;
  updateUserInfo(id: string, data: Partial<InsertUser>): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // KYC
  getKYC(userId: string): Promise<KYC | undefined>;
  getKYCById(id: string): Promise<KYC | undefined>;
  createKYC(kycData: InsertKYC): Promise<KYC>;
  updateKYCStatus(id: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<void>;
  getPendingKYC(): Promise<KYC[]>;

  // Health Profiles
  getHealthProfile(userId: string): Promise<HealthProfile | undefined>;
  createHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile>;
  updateHealthProfile(userId: string, profile: Partial<InsertHealthProfile>): Promise<void>;

  // Medical Records
  getMedicalRecords(userId: string): Promise<MedicalRecord[]>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;

  // Access Control
  getAccessRequests(patientId: string): Promise<AccessControl[]>;
  getAccessRequestsByRequester(requesterId: string): Promise<AccessControl[]>;
  getGrantedAccess(patientId: string): Promise<AccessControl[]>;
  getHospitalNotifiedAccessRequests(hospitalName: string): Promise<AccessControl[]>;
  createAccessRequest(access: InsertAccessControl): Promise<AccessControl>;
  updateAccessStatus(id: string, status: string): Promise<void>;
  checkAccess(patientId: string, requesterId: string): Promise<boolean>;

  // Treatment Logs
  getTreatmentLogs(patientId?: string, doctorId?: string): Promise<TreatmentLog[]>;
  createTreatmentLog(log: InsertTreatmentLog): Promise<TreatmentLog>;

  // Insurance Providers
  getInsuranceProviders(): Promise<InsuranceProvider[]>;
  getInsuranceProviderByUserId(userId: string): Promise<InsuranceProvider | undefined>;
  createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider>;
  updateInsuranceProvider(id: string, data: Partial<InsertInsuranceProvider>): Promise<void>;

  // Patient Insurance Connections
  getPatientInsuranceConnections(patientId: string): Promise<any[]>;
  getProviderConnections(providerId: string): Promise<any[]>;
  createInsuranceConnectionRequest(connection: InsertPatientInsuranceConnection): Promise<PatientInsuranceConnection>;
  updateConnectionStatus(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<void>;
  updateConnectionBilling(id: string, lastBillingDate: Date, missedPaymentsCount: number): Promise<void>;
  disconnectInsurance(id: string): Promise<void>;

  // Claims
  getClaims(params: { patientId?: string; hospitalId?: string; connectionId?: string }): Promise<any[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  updateClaimStatus(id: string, status: string, data?: Partial<Claim>): Promise<void>;
  approveClaimByPatient(claimId: string, patientNote?: string): Promise<void>;
  rejectClaimByPatient(claimId: string, patientNote?: string): Promise<void>;

  // Audit Logs
  getAuditLogs(userId?: string): Promise<AuditLog[]>;
  getUserAuditLogs(userId: string): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Emergency QR
  getEmergencyQR(userId: string): Promise<EmergencyQR | undefined>;
  createEmergencyQR(qr: InsertEmergencyQR): Promise<EmergencyQR>;
  incrementQRScanCount(userId: string): Promise<void>;

  // Consultation Requests
  getConsultationRequests(params: { patientId?: string; doctorId?: string }): Promise<ConsultationRequest[]>;
  createConsultationRequest(request: InsertConsultationRequest): Promise<ConsultationRequest>;
  updateConsultationStatus(id: string, status: string, rejectionReason?: string): Promise<void>;
  getConsultationById(id: string): Promise<ConsultationRequest | undefined>;

  // Chat Messages
  getChatMessages(consultationId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(consultationId: string, receiverId: string): Promise<void>;
  getUsersByHospital(hospitalName: string, role?: string): Promise<User[]>;

  // Patient Admissions
  getPatientAdmissions(params: { patientId?: string; hospitalId?: string; status?: string }): Promise<PatientAdmission[]>;
  getCurrentAdmission(patientId: string, hospitalId: string): Promise<PatientAdmission | undefined>;
  createPatientAdmission(admission: InsertPatientAdmission): Promise<PatientAdmission>;
  dischargePatient(id: string, dischargedById: string, dischargeNotes?: string): Promise<void>;
  updatePatientAdmissionStatus(id: string, status: string): Promise<void>;
  
  // Subscription Payments
  getSubscriptionPayment(userId: string, role: string): Promise<SubscriptionPayment | undefined>;
  getSubscriptionPaymentByTxHash(transactionHash: string): Promise<SubscriptionPayment | undefined>;
  createSubscriptionPayment(payment: InsertSubscriptionPayment): Promise<SubscriptionPayment>;
  checkActiveSubscription(userId: string, role: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    const normalizedAddress = walletAddress.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.walletAddress, normalizedAddress));
    return user || undefined;
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStatus(id: string, status: string): Promise<void> {
    await db.update(users).set({ status }).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role, status: "verified" }).where(eq(users.id, id));
  }

  async updateUserProfilePicture(id: string, profilePicture: string): Promise<void> {
    await db.update(users).set({ profilePicture }).where(eq(users.id, id));
  }

  async updateUserInfo(id: string, data: Partial<InsertUser>): Promise<void> {
    await db.update(users).set(data).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // KYC
  async getKYC(userId: string): Promise<KYC | undefined> {
    const [kycData] = await db.select().from(kyc).where(eq(kyc.userId, userId)).orderBy(desc(kyc.submittedAt));
    return kycData || undefined;
  }

  async getKYCById(id: string): Promise<KYC | undefined> {
    const [kycData] = await db.select().from(kyc).where(eq(kyc.id, id));
    return kycData || undefined;
  }

  async createKYC(kycData: InsertKYC): Promise<KYC> {
    const [created] = await db.insert(kyc).values(kycData).returning();
    return created;
  }

  async updateKYCStatus(id: string, status: string, reviewedBy: string, rejectionReason?: string): Promise<void> {
    await db.update(kyc).set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason || null,
    }).where(eq(kyc.id, id));
  }

  async getPendingKYC(): Promise<KYC[]> {
    return await db.select().from(kyc).where(eq(kyc.status, "pending")).orderBy(desc(kyc.submittedAt));
  }

  // Health Profiles
  async getHealthProfile(userId: string): Promise<HealthProfile | undefined> {
    const [profile] = await db.select().from(healthProfiles).where(eq(healthProfiles.userId, userId));
    return profile || undefined;
  }

  async createHealthProfile(profile: InsertHealthProfile): Promise<HealthProfile> {
    const [created] = await db.insert(healthProfiles).values(profile).returning();
    return created;
  }

  async updateHealthProfile(userId: string, profileData: Partial<InsertHealthProfile>): Promise<void> {
    await db.update(healthProfiles).set({ ...profileData, updatedAt: new Date() }).where(eq(healthProfiles.userId, userId));
  }

  // Medical Records
  async getMedicalRecords(userId: string): Promise<MedicalRecord[]> {
    return await db.select().from(medicalRecords).where(eq(medicalRecords.userId, userId)).orderBy(desc(medicalRecords.uploadedAt));
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [created] = await db.insert(medicalRecords).values(record).returning();
    return created;
  }

  // Access Control
  async getAccessRequests(patientId: string): Promise<AccessControl[]> {
    return await db.select().from(accessControl).where(eq(accessControl.patientId, patientId)).orderBy(desc(accessControl.requestedAt));
  }

  async getAccessRequestsByRequester(requesterId: string): Promise<AccessControl[]> {
    return await db.select().from(accessControl).where(eq(accessControl.requesterId, requesterId)).orderBy(desc(accessControl.requestedAt));
  }

  async getGrantedAccess(patientId: string): Promise<AccessControl[]> {
    return await db.select().from(accessControl).where(
      and(
        eq(accessControl.patientId, patientId),
        eq(accessControl.status, "granted")
      )
    ).orderBy(desc(accessControl.respondedAt));
  }

  async createAccessRequest(access: InsertAccessControl): Promise<AccessControl> {
    const [created] = await db.insert(accessControl).values(access).returning();
    return created;
  }

  async updateAccessStatus(id: string, status: string): Promise<void> {
    await db.update(accessControl).set({ status, respondedAt: new Date() }).where(eq(accessControl.id, id));
  }

  async checkAccess(patientId: string, requesterId: string): Promise<boolean> {
    const [access] = await db.select().from(accessControl).where(
      and(
        eq(accessControl.patientId, patientId),
        eq(accessControl.requesterId, requesterId),
        eq(accessControl.status, "granted")
      )
    );
    return !!access;
  }

  async getHospitalNotifiedAccessRequests(hospitalName: string): Promise<AccessControl[]> {
    // Get all access requests where hospitalNotified is true
    const requests = await db.select().from(accessControl).where(
      and(
        eq(accessControl.hospitalNotified, true),
        eq(accessControl.isEmergency, true)
      )
    ).orderBy(desc(accessControl.requestedAt));
    
    // Filter to only show requests for patients at this hospital
    const filtered = await Promise.all(requests.map(async (req) => {
      const patient = await this.getUser(req.patientId);
      return patient?.hospitalName === hospitalName ? req : null;
    }));
    
    return filtered.filter((req): req is AccessControl => req !== null);
  }

  // Treatment Logs
  async getTreatmentLogs(patientId?: string, doctorId?: string): Promise<TreatmentLog[]> {
    let query = db.select().from(treatmentLogs);
    
    if (patientId && doctorId) {
      return await query.where(and(eq(treatmentLogs.patientId, patientId), eq(treatmentLogs.doctorId, doctorId))).orderBy(desc(treatmentLogs.createdAt));
    } else if (patientId) {
      return await query.where(eq(treatmentLogs.patientId, patientId)).orderBy(desc(treatmentLogs.createdAt));
    } else if (doctorId) {
      return await query.where(eq(treatmentLogs.doctorId, doctorId)).orderBy(desc(treatmentLogs.createdAt));
    }
    
    return await query.orderBy(desc(treatmentLogs.createdAt));
  }

  async createTreatmentLog(log: InsertTreatmentLog): Promise<TreatmentLog> {
    const [created] = await db.insert(treatmentLogs).values(log).returning();
    return created;
  }

  // Insurance Providers
  async getInsuranceProviders(): Promise<InsuranceProvider[]> {
    return await db.select().from(insuranceProviders).where(eq(insuranceProviders.isActive, true));
  }

  async getInsuranceProviderByUserId(userId: string): Promise<InsuranceProvider | undefined> {
    const [provider] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.userId, userId));
    return provider || undefined;
  }

  async createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider> {
    const [created] = await db.insert(insuranceProviders).values(provider).returning();
    return created;
  }

  async updateInsuranceProvider(id: string, data: Partial<InsertInsuranceProvider>): Promise<void> {
    await db.update(insuranceProviders).set(data).where(eq(insuranceProviders.id, id));
  }

  // Patient Insurance Connections
  async getPatientInsuranceConnections(patientId: string): Promise<any[]> {
    const result = await db
      .select({
        id: patientInsuranceConnections.id,
        patientId: patientInsuranceConnections.patientId,
        providerId: patientInsuranceConnections.providerId,
        status: patientInsuranceConnections.status,
        connectionReason: patientInsuranceConnections.connectionReason,
        requestedAt: patientInsuranceConnections.requestedAt,
        approvedAt: patientInsuranceConnections.approvedAt,
        disconnectedAt: patientInsuranceConnections.disconnectedAt,
        lastBillingDate: patientInsuranceConnections.lastBillingDate,
        missedPaymentsCount: patientInsuranceConnections.missedPaymentsCount,
        rejectionReason: patientInsuranceConnections.rejectionReason,
        providerName: insuranceProviders.providerName,
        monthlyFee: insuranceProviders.monthlyFee,
        coverageLimit: insuranceProviders.coverageLimit,
        coverageTypes: insuranceProviders.coverageTypes,
      })
      .from(patientInsuranceConnections)
      .leftJoin(insuranceProviders, eq(patientInsuranceConnections.providerId, insuranceProviders.id))
      .where(eq(patientInsuranceConnections.patientId, patientId))
      .orderBy(desc(patientInsuranceConnections.requestedAt));
    return result;
  }

  async getProviderConnections(providerId: string): Promise<any[]> {
    const result = await db
      .select({
        id: patientInsuranceConnections.id,
        patientId: patientInsuranceConnections.patientId,
        patientUid: users.uid,
        patientUsername: users.username,
        patientEmail: users.email,
        status: patientInsuranceConnections.status,
        connectionReason: patientInsuranceConnections.connectionReason,
        requestedAt: patientInsuranceConnections.requestedAt,
        approvedAt: patientInsuranceConnections.approvedAt,
        disconnectedAt: patientInsuranceConnections.disconnectedAt,
        lastBillingDate: patientInsuranceConnections.lastBillingDate,
        missedPaymentsCount: patientInsuranceConnections.missedPaymentsCount,
        bloodType: healthProfiles.bloodType,
        allergies: healthProfiles.allergies,
        chronicConditions: healthProfiles.chronicConditions,
        currentMedications: healthProfiles.currentMedications,
        emergencyContact: healthProfiles.emergencyContact,
        emergencyPhone: healthProfiles.emergencyPhone,
        height: healthProfiles.height,
        weight: healthProfiles.weight,
        organDonor: healthProfiles.organDonor,
      })
      .from(patientInsuranceConnections)
      .leftJoin(users, eq(patientInsuranceConnections.patientId, users.id))
      .leftJoin(healthProfiles, eq(patientInsuranceConnections.patientId, healthProfiles.userId))
      .where(eq(patientInsuranceConnections.providerId, providerId))
      .orderBy(desc(patientInsuranceConnections.requestedAt));
    return result;
  }

  async createInsuranceConnectionRequest(connection: InsertPatientInsuranceConnection): Promise<PatientInsuranceConnection> {
    const [created] = await db.insert(patientInsuranceConnections).values(connection).returning();
    return created;
  }

  async updateConnectionStatus(id: string, status: string, reviewedBy?: string, rejectionReason?: string): Promise<void> {
    const updateData: any = {
      status,
      rejectionReason: rejectionReason || null,
    };
    
    if (status === "connected") {
      updateData.approvedAt = new Date();
      updateData.lastBillingDate = new Date();
    } else if (status === "disconnected") {
      updateData.disconnectedAt = new Date();
    }
    
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }
    
    await db.update(patientInsuranceConnections).set(updateData).where(eq(patientInsuranceConnections.id, id));
  }

  async updateConnectionBilling(id: string, lastBillingDate: Date, missedPaymentsCount: number): Promise<void> {
    await db.update(patientInsuranceConnections).set({
      lastBillingDate,
      missedPaymentsCount,
    }).where(eq(patientInsuranceConnections.id, id));
  }

  async disconnectInsurance(id: string): Promise<void> {
    await db.update(patientInsuranceConnections).set({
      status: "disconnected",
      disconnectedAt: new Date(),
    }).where(eq(patientInsuranceConnections.id, id));
  }

  // Claims
  async getClaims(params: { patientId?: string; hospitalId?: string; connectionId?: string }): Promise<any[]> {
    let query = db
      .select({
        id: claims.id,
        claimNumber: claims.claimNumber,
        patientId: claims.patientId,
        treatmentLogId: claims.treatmentLogId,
        hospitalId: claims.hospitalId,
        connectionId: claims.connectionId,
        amount: claims.amount,
        claimType: claims.claimType,
        treatmentDescription: claims.treatmentDescription,
        invoiceCID: claims.invoiceCID,
        invoiceSignature: claims.invoiceSignature,
        status: claims.status,
        submittedAt: claims.submittedAt,
        respondedAt: claims.respondedAt,
        patientNote: claims.patientNote,
        rejectionReason: claims.rejectionReason,
        paidAt: claims.paidAt,
        paidAmount: claims.paidAmount,
        hospitalName: users.hospitalName,
      })
      .from(claims)
      .leftJoin(users, eq(claims.hospitalId, users.id));
    
    const conditions = [];
    if (params.patientId) conditions.push(eq(claims.patientId, params.patientId));
    if (params.hospitalId) conditions.push(eq(claims.hospitalId, params.hospitalId));
    if (params.connectionId) conditions.push(eq(claims.connectionId, params.connectionId));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(claims.submittedAt));
    }
    
    return await query.orderBy(desc(claims.submittedAt));
  }

  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [created] = await db.insert(claims).values(claim).returning();
    return created;
  }

  async updateClaimStatus(id: string, status: string, data?: Partial<Claim>): Promise<void> {
    await db.update(claims).set({
      status,
      respondedAt: new Date(),
      ...data,
    }).where(eq(claims.id, id));
  }

  async approveClaimByPatient(claimId: string, patientNote?: string): Promise<void> {
    await db.update(claims).set({
      status: "approved",
      respondedAt: new Date(),
      patientNote: patientNote || null,
    }).where(eq(claims.id, claimId));
  }

  async rejectClaimByPatient(claimId: string, patientNote?: string): Promise<void> {
    await db.update(claims).set({
      status: "rejected",
      respondedAt: new Date(),
      patientNote: patientNote || null,
    }).where(eq(claims.id, claimId));
  }

  // Audit Logs
  async getAuditLogs(userId?: string): Promise<AuditLog[]> {
    if (userId) {
      return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.timestamp));
    }
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(1000);
  }

  async getUserAuditLogs(userId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.timestamp));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // Emergency QR
  async getEmergencyQR(userId: string): Promise<EmergencyQR | undefined> {
    const [qr] = await db.select().from(emergencyQRCodes).where(eq(emergencyQRCodes.userId, userId));
    return qr || undefined;
  }

  async createEmergencyQR(qrData: InsertEmergencyQR): Promise<EmergencyQR> {
    const existing = await this.getEmergencyQR(qrData.userId);
    if (existing) {
      const [updated] = await db.update(emergencyQRCodes).set({
        qrData: qrData.qrData,
        signedToken: qrData.signedToken,
        generatedAt: new Date(),
        expiresAt: qrData.expiresAt,
      }).where(eq(emergencyQRCodes.userId, qrData.userId)).returning();
      return updated;
    }
    
    const [created] = await db.insert(emergencyQRCodes).values(qrData).returning();
    return created;
  }

  async incrementQRScanCount(userId: string): Promise<void> {
    const qr = await this.getEmergencyQR(userId);
    if (qr) {
      await db.update(emergencyQRCodes).set({
        scanCount: (qr.scanCount || 0) + 1,
      }).where(eq(emergencyQRCodes.userId, userId));
    }
  }

  // Consultation Requests
  async getConsultationRequests(params: { patientId?: string; doctorId?: string }): Promise<ConsultationRequest[]> {
    let query = db.select().from(consultationRequests);
    
    const conditions = [];
    if (params.patientId) conditions.push(eq(consultationRequests.patientId, params.patientId));
    if (params.doctorId) conditions.push(eq(consultationRequests.doctorId, params.doctorId));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(consultationRequests.requestedAt));
    }
    
    return await query.orderBy(desc(consultationRequests.requestedAt));
  }

  async createConsultationRequest(request: InsertConsultationRequest): Promise<ConsultationRequest> {
    const [created] = await db.insert(consultationRequests).values(request).returning();
    return created;
  }

  async updateConsultationStatus(id: string, status: string, rejectionReason?: string): Promise<void> {
    await db.update(consultationRequests).set({ 
      status, 
      respondedAt: new Date(),
      rejectionReason: rejectionReason || null,
    }).where(eq(consultationRequests.id, id));
  }

  async getConsultationById(id: string): Promise<ConsultationRequest | undefined> {
    const [consultation] = await db.select().from(consultationRequests).where(eq(consultationRequests.id, id));
    return consultation || undefined;
  }

  // Chat Messages
  async getChatMessages(consultationId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.consultationId, consultationId))
      .orderBy(chatMessages.sentAt);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async markMessagesAsRead(consultationId: string, receiverId: string): Promise<void> {
    await db.update(chatMessages).set({ isRead: true })
      .where(and(
        eq(chatMessages.consultationId, consultationId),
        eq(chatMessages.receiverId, receiverId)
      ));
  }

  async getUsersByHospital(hospitalName: string, role?: string): Promise<User[]> {
    if (role) {
      return await db.select().from(users).where(and(
        eq(users.hospitalName, hospitalName),
        eq(users.role, role)
      )).orderBy(users.username);
    }
    
    return await db.select().from(users).where(eq(users.hospitalName, hospitalName)).orderBy(users.username);
  }

  // Patient Admissions
  async getPatientAdmissions(params: { patientId?: string; hospitalId?: string; status?: string }): Promise<PatientAdmission[]> {
    const conditions = [];
    if (params.patientId) conditions.push(eq(patientAdmissions.patientId, params.patientId));
    if (params.hospitalId) conditions.push(eq(patientAdmissions.hospitalId, params.hospitalId));
    if (params.status) conditions.push(eq(patientAdmissions.status, params.status));

    if (conditions.length > 0) {
      return await db.select().from(patientAdmissions).where(and(...conditions)).orderBy(desc(patientAdmissions.admissionDate));
    }

    return await db.select().from(patientAdmissions).orderBy(desc(patientAdmissions.admissionDate));
  }

  async getCurrentAdmission(patientId: string, hospitalId: string): Promise<PatientAdmission | undefined> {
    const [admission] = await db.select().from(patientAdmissions)
      .where(and(
        eq(patientAdmissions.patientId, patientId),
        eq(patientAdmissions.hospitalId, hospitalId),
        eq(patientAdmissions.status, "admitted")
      ));
    return admission || undefined;
  }

  async createPatientAdmission(admission: InsertPatientAdmission): Promise<PatientAdmission> {
    const [created] = await db.insert(patientAdmissions).values(admission).returning();
    return created;
  }

  async dischargePatient(id: string, dischargedById: string, dischargeNotes?: string): Promise<void> {
    await db.update(patientAdmissions).set({
      status: "discharged",
      dischargeDate: new Date(),
      dischargedById,
      dischargeNotes: dischargeNotes || null,
    }).where(eq(patientAdmissions.id, id));
  }

  async updatePatientAdmissionStatus(id: string, status: string): Promise<void> {
    await db.update(patientAdmissions).set({ status }).where(eq(patientAdmissions.id, id));
  }

  // Subscription Payments
  async getSubscriptionPayment(userId: string, role: string): Promise<SubscriptionPayment | undefined> {
    const [payment] = await db.select().from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.userId, userId),
        eq(subscriptionPayments.role, role)
      ))
      .orderBy(desc(subscriptionPayments.paidAt));
    return payment || undefined;
  }

  async getSubscriptionPaymentByTxHash(transactionHash: string): Promise<SubscriptionPayment | undefined> {
    const [payment] = await db.select().from(subscriptionPayments)
      .where(eq(subscriptionPayments.transactionHash, transactionHash));
    return payment || undefined;
  }

  async createSubscriptionPayment(payment: InsertSubscriptionPayment): Promise<SubscriptionPayment> {
    const [created] = await db.insert(subscriptionPayments).values(payment).returning();
    return created;
  }

  async checkActiveSubscription(userId: string, role: string): Promise<boolean> {
    const [payment] = await db.select().from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.userId, userId),
        eq(subscriptionPayments.role, role),
        eq(subscriptionPayments.status, "confirmed")
      ))
      .orderBy(desc(subscriptionPayments.paidAt));
    
    if (!payment) return false;
    
    // Check if subscription is still active (not expired)
    return new Date() < new Date(payment.expiresAt);
  }
}

export const storage = new DatabaseStorage();
