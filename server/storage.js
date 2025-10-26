import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { users, kyc, healthProfiles, medicalRecords, accessControl, treatmentLogs, insuranceProviders, patientInsuranceConnections, claims, auditLogs, emergencyQRCodes, consultationRequests, chatMessages, patientAdmissions, subscriptionPayments, } from "@shared/schema";
export class DatabaseStorage {
    // Users
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }
    async getUserByWalletAddress(walletAddress) {
        const normalizedAddress = walletAddress.toLowerCase();
        const [user] = await db.select().from(users).where(eq(users.walletAddress, normalizedAddress));
        return user || undefined;
    }
    async getUserByUid(uid) {
        const [user] = await db.select().from(users).where(eq(users.uid, uid));
        return user || undefined;
    }
    async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || undefined;
    }
    async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }
    async updateUserStatus(id, status) {
        await db.update(users).set({ status }).where(eq(users.id, id));
    }
    async updateUserRole(id, role) {
        await db.update(users).set({ role, status: "verified" }).where(eq(users.id, id));
    }
    async updateUserProfilePicture(id, profilePicture) {
        await db.update(users).set({ profilePicture }).where(eq(users.id, id));
    }
    async updateUserInfo(id, data) {
        await db.update(users).set(data).where(eq(users.id, id));
    }
    async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
    }
    // KYC
    async getKYC(userId) {
        const [kycData] = await db.select().from(kyc).where(eq(kyc.userId, userId)).orderBy(desc(kyc.submittedAt));
        return kycData || undefined;
    }
    async getKYCById(id) {
        const [kycData] = await db.select().from(kyc).where(eq(kyc.id, id));
        return kycData || undefined;
    }
    async createKYC(kycData) {
        const [created] = await db.insert(kyc).values(kycData).returning();
        return created;
    }
    async updateKYCStatus(id, status, reviewedBy, rejectionReason) {
        await db.update(kyc).set({
            status,
            reviewedBy,
            reviewedAt: new Date(),
            rejectionReason: rejectionReason || null,
        }).where(eq(kyc.id, id));
    }
    async getPendingKYC() {
        return await db.select().from(kyc).where(eq(kyc.status, "pending")).orderBy(desc(kyc.submittedAt));
    }
    // Health Profiles
    async getHealthProfile(userId) {
        const [profile] = await db.select().from(healthProfiles).where(eq(healthProfiles.userId, userId));
        return profile || undefined;
    }
    async createHealthProfile(profile) {
        const [created] = await db.insert(healthProfiles).values(profile).returning();
        return created;
    }
    async updateHealthProfile(userId, profileData) {
        await db.update(healthProfiles).set({ ...profileData, updatedAt: new Date() }).where(eq(healthProfiles.userId, userId));
    }
    // Medical Records
    async getMedicalRecords(userId) {
        return await db.select().from(medicalRecords).where(eq(medicalRecords.userId, userId)).orderBy(desc(medicalRecords.uploadedAt));
    }
    async createMedicalRecord(record) {
        const [created] = await db.insert(medicalRecords).values(record).returning();
        return created;
    }
    // Access Control
    async getAccessRequests(patientId) {
        return await db.select().from(accessControl).where(eq(accessControl.patientId, patientId)).orderBy(desc(accessControl.requestedAt));
    }
    async getAccessRequestsByRequester(requesterId) {
        return await db.select().from(accessControl).where(eq(accessControl.requesterId, requesterId)).orderBy(desc(accessControl.requestedAt));
    }
    async getGrantedAccess(patientId) {
        return await db.select().from(accessControl).where(and(eq(accessControl.patientId, patientId), eq(accessControl.status, "granted"))).orderBy(desc(accessControl.respondedAt));
    }
    async createAccessRequest(access) {
        const [created] = await db.insert(accessControl).values(access).returning();
        return created;
    }
    async updateAccessStatus(id, status) {
        await db.update(accessControl).set({ status, respondedAt: new Date() }).where(eq(accessControl.id, id));
    }
    async checkAccess(patientId, requesterId) {
        const [access] = await db.select().from(accessControl).where(and(eq(accessControl.patientId, patientId), eq(accessControl.requesterId, requesterId), eq(accessControl.status, "granted")));
        return !!access;
    }
    async getHospitalNotifiedAccessRequests(hospitalName) {
        // Get all access requests where hospitalNotified is true
        const requests = await db.select().from(accessControl).where(and(eq(accessControl.hospitalNotified, true), eq(accessControl.isEmergency, true))).orderBy(desc(accessControl.requestedAt));
        // Filter to only show requests for patients at this hospital
        const filtered = await Promise.all(requests.map(async (req) => {
            const patient = await this.getUser(req.patientId);
            return patient?.hospitalName === hospitalName ? req : null;
        }));
        return filtered.filter((req) => req !== null);
    }
    // Treatment Logs
    async getTreatmentLogs(patientId, doctorId) {
        let query = db.select().from(treatmentLogs);
        if (patientId && doctorId) {
            return await query.where(and(eq(treatmentLogs.patientId, patientId), eq(treatmentLogs.doctorId, doctorId))).orderBy(desc(treatmentLogs.createdAt));
        }
        else if (patientId) {
            return await query.where(eq(treatmentLogs.patientId, patientId)).orderBy(desc(treatmentLogs.createdAt));
        }
        else if (doctorId) {
            return await query.where(eq(treatmentLogs.doctorId, doctorId)).orderBy(desc(treatmentLogs.createdAt));
        }
        return await query.orderBy(desc(treatmentLogs.createdAt));
    }
    async createTreatmentLog(log) {
        const [created] = await db.insert(treatmentLogs).values(log).returning();
        return created;
    }
    // Insurance Providers
    async getInsuranceProviders() {
        return await db.select().from(insuranceProviders).where(eq(insuranceProviders.isActive, true));
    }
    async getInsuranceProviderByUserId(userId) {
        const [provider] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.userId, userId));
        return provider || undefined;
    }
    async createInsuranceProvider(provider) {
        const [created] = await db.insert(insuranceProviders).values(provider).returning();
        return created;
    }
    async updateInsuranceProvider(id, data) {
        await db.update(insuranceProviders).set(data).where(eq(insuranceProviders.id, id));
    }
    // Patient Insurance Connections
    async getPatientInsuranceConnections(patientId) {
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
    async getProviderConnections(providerId) {
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
    async createInsuranceConnectionRequest(connection) {
        const [created] = await db.insert(patientInsuranceConnections).values(connection).returning();
        return created;
    }
    async updateConnectionStatus(id, status, reviewedBy, rejectionReason) {
        const updateData = {
            status,
            rejectionReason: rejectionReason || null,
        };
        if (status === "connected") {
            updateData.approvedAt = new Date();
            updateData.lastBillingDate = new Date();
        }
        else if (status === "disconnected") {
            updateData.disconnectedAt = new Date();
        }
        if (reviewedBy) {
            updateData.reviewedBy = reviewedBy;
        }
        await db.update(patientInsuranceConnections).set(updateData).where(eq(patientInsuranceConnections.id, id));
    }
    async updateConnectionBilling(id, lastBillingDate, missedPaymentsCount) {
        await db.update(patientInsuranceConnections).set({
            lastBillingDate,
            missedPaymentsCount,
        }).where(eq(patientInsuranceConnections.id, id));
    }
    async disconnectInsurance(id) {
        await db.update(patientInsuranceConnections).set({
            status: "disconnected",
            disconnectedAt: new Date(),
        }).where(eq(patientInsuranceConnections.id, id));
    }
    // Claims
    async getClaims(params) {
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
        if (params.patientId)
            conditions.push(eq(claims.patientId, params.patientId));
        if (params.hospitalId)
            conditions.push(eq(claims.hospitalId, params.hospitalId));
        if (params.connectionId)
            conditions.push(eq(claims.connectionId, params.connectionId));
        if (conditions.length > 0) {
            return await query.where(and(...conditions)).orderBy(desc(claims.submittedAt));
        }
        return await query.orderBy(desc(claims.submittedAt));
    }
    async createClaim(claim) {
        const [created] = await db.insert(claims).values(claim).returning();
        return created;
    }
    async updateClaimStatus(id, status, data) {
        await db.update(claims).set({
            status,
            respondedAt: new Date(),
            ...data,
        }).where(eq(claims.id, id));
    }
    async approveClaimByPatient(claimId, patientNote) {
        await db.update(claims).set({
            status: "approved",
            respondedAt: new Date(),
            patientNote: patientNote || null,
        }).where(eq(claims.id, claimId));
    }
    async rejectClaimByPatient(claimId, patientNote) {
        await db.update(claims).set({
            status: "rejected",
            respondedAt: new Date(),
            patientNote: patientNote || null,
        }).where(eq(claims.id, claimId));
    }
    // Audit Logs
    async getAuditLogs(userId) {
        if (userId) {
            return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.timestamp));
        }
        return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(1000);
    }
    async getUserAuditLogs(userId) {
        return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(desc(auditLogs.timestamp));
    }
    async createAuditLog(log) {
        const [created] = await db.insert(auditLogs).values(log).returning();
        return created;
    }
    // Emergency QR
    async getEmergencyQR(userId) {
        const [qr] = await db.select().from(emergencyQRCodes).where(eq(emergencyQRCodes.userId, userId));
        return qr || undefined;
    }
    async createEmergencyQR(qrData) {
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
    async incrementQRScanCount(userId) {
        const qr = await this.getEmergencyQR(userId);
        if (qr) {
            await db.update(emergencyQRCodes).set({
                scanCount: (qr.scanCount || 0) + 1,
            }).where(eq(emergencyQRCodes.userId, userId));
        }
    }
    // Consultation Requests
    async getConsultationRequests(params) {
        let query = db.select().from(consultationRequests);
        const conditions = [];
        if (params.patientId)
            conditions.push(eq(consultationRequests.patientId, params.patientId));
        if (params.doctorId)
            conditions.push(eq(consultationRequests.doctorId, params.doctorId));
        if (conditions.length > 0) {
            return await query.where(and(...conditions)).orderBy(desc(consultationRequests.requestedAt));
        }
        return await query.orderBy(desc(consultationRequests.requestedAt));
    }
    async createConsultationRequest(request) {
        const [created] = await db.insert(consultationRequests).values(request).returning();
        return created;
    }
    async updateConsultationStatus(id, status, rejectionReason) {
        await db.update(consultationRequests).set({
            status,
            respondedAt: new Date(),
            rejectionReason: rejectionReason || null,
        }).where(eq(consultationRequests.id, id));
    }
    async getConsultationById(id) {
        const [consultation] = await db.select().from(consultationRequests).where(eq(consultationRequests.id, id));
        return consultation || undefined;
    }
    // Chat Messages
    async getChatMessages(consultationId) {
        return await db.select().from(chatMessages)
            .where(eq(chatMessages.consultationId, consultationId))
            .orderBy(chatMessages.sentAt);
    }
    async createChatMessage(message) {
        const [created] = await db.insert(chatMessages).values(message).returning();
        return created;
    }
    async markMessagesAsRead(consultationId, receiverId) {
        await db.update(chatMessages).set({ isRead: true })
            .where(and(eq(chatMessages.consultationId, consultationId), eq(chatMessages.receiverId, receiverId)));
    }
    async getUsersByHospital(hospitalName, role) {
        if (role) {
            return await db.select().from(users).where(and(eq(users.hospitalName, hospitalName), eq(users.role, role))).orderBy(users.username);
        }
        return await db.select().from(users).where(eq(users.hospitalName, hospitalName)).orderBy(users.username);
    }
    // Patient Admissions
    async getPatientAdmissions(params) {
        const conditions = [];
        if (params.patientId)
            conditions.push(eq(patientAdmissions.patientId, params.patientId));
        if (params.hospitalId)
            conditions.push(eq(patientAdmissions.hospitalId, params.hospitalId));
        if (params.status)
            conditions.push(eq(patientAdmissions.status, params.status));
        if (conditions.length > 0) {
            return await db.select().from(patientAdmissions).where(and(...conditions)).orderBy(desc(patientAdmissions.admissionDate));
        }
        return await db.select().from(patientAdmissions).orderBy(desc(patientAdmissions.admissionDate));
    }
    async getCurrentAdmission(patientId, hospitalId) {
        const [admission] = await db.select().from(patientAdmissions)
            .where(and(eq(patientAdmissions.patientId, patientId), eq(patientAdmissions.hospitalId, hospitalId), eq(patientAdmissions.status, "admitted")));
        return admission || undefined;
    }
    async createPatientAdmission(admission) {
        const [created] = await db.insert(patientAdmissions).values(admission).returning();
        return created;
    }
    async dischargePatient(id, dischargedById, dischargeNotes) {
        await db.update(patientAdmissions).set({
            status: "discharged",
            dischargeDate: new Date(),
            dischargedById,
            dischargeNotes: dischargeNotes || null,
        }).where(eq(patientAdmissions.id, id));
    }
    async updatePatientAdmissionStatus(id, status) {
        await db.update(patientAdmissions).set({ status }).where(eq(patientAdmissions.id, id));
    }
    // Subscription Payments
    async getSubscriptionPayment(userId, role) {
        const [payment] = await db.select().from(subscriptionPayments)
            .where(and(eq(subscriptionPayments.userId, userId), eq(subscriptionPayments.role, role)))
            .orderBy(desc(subscriptionPayments.paidAt));
        return payment || undefined;
    }
    async getSubscriptionPaymentByTxHash(transactionHash) {
        const [payment] = await db.select().from(subscriptionPayments)
            .where(eq(subscriptionPayments.transactionHash, transactionHash));
        return payment || undefined;
    }
    async createSubscriptionPayment(payment) {
        const [created] = await db.insert(subscriptionPayments).values(payment).returning();
        return created;
    }
    async checkActiveSubscription(userId, role) {
        const [payment] = await db.select().from(subscriptionPayments)
            .where(and(eq(subscriptionPayments.userId, userId), eq(subscriptionPayments.role, role), eq(subscriptionPayments.status, "confirmed")))
            .orderBy(desc(subscriptionPayments.paidAt));
        if (!payment)
            return false;
        // Check if subscription is still active (not expired)
        return new Date() < new Date(payment.expiresAt);
    }
}
export const storage = new DatabaseStorage();
