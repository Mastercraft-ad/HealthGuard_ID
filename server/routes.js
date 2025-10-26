import { createServer } from "http";
import { storage } from "./storage";
import CryptoJS from "crypto-js";
import { randomBytes } from "crypto";
import { z } from "zod";
import { insertClaimSchema, insertPatientInsuranceConnectionSchema } from "@shared/schema";
import { ipfsService } from "./ipfs";
// Admin wallet address
const ADMIN_WALLET_ADDRESS = "0x3c17f3F514658fACa2D24DE1d29F542a836FD10A".toLowerCase();
// Validation schemas for patient admissions
const admitPatientSchema = z.object({
    patientId: z.string().min(1, "Patient ID is required"),
    doctorId: z.string().optional(),
    admissionReason: z.string().min(1, "Admission reason is required"),
    roomNumber: z.string().optional(),
    ward: z.string().optional(),
});
const dischargePatientSchema = z.object({
    admissionId: z.string().min(1, "Admission ID is required"),
    dischargeNotes: z.string().optional(),
});
// Helper function to generate UID (at least 9 digits after HID) with collision handling
async function generateUID() {
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
        const randomNum = Math.floor(Math.random() * 900000000) + 100000000;
        const uid = `HID${randomNum}`;
        // Check if UID already exists
        const existing = await storage.getUserByUid(uid);
        if (!existing) {
            return uid;
        }
        attempts++;
    }
    // Fallback to timestamp-based UID if collision after retries
    return `HID${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
// Helper function to generate claim number
function generateClaimNumber() {
    return `CLM-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
// Helper function to generate file hash
function generateFileHash(content) {
    return CryptoJS.SHA256(content).toString();
}
// Helper function to upload to IPFS and return CID
async function uploadToIPFS(fileData, fileName, metadata) {
    try {
        return await ipfsService.uploadFile(fileData, fileName, metadata);
    }
    catch (error) {
        console.error("IPFS upload failed, using fallback:", error);
        // Fallback to simulated CID if IPFS fails
        const cid = `Qm${randomBytes(8).toString("hex")}`;
        const hash = generateFileHash(fileData);
        return { cid, hash, url: `https://gateway.pinata.cloud/ipfs/${cid}` };
    }
}
// Helper function to upload JSON to IPFS
async function uploadJSONToIPFS(data, fileName) {
    try {
        return await ipfsService.uploadJSON(data, fileName);
    }
    catch (error) {
        console.error("IPFS JSON upload failed, using fallback:", error);
        // Fallback to simulated CID if IPFS fails
        const cid = `Qm${randomBytes(8).toString("hex")}`;
        const hash = generateFileHash(JSON.stringify(data));
        return { cid, hash, url: `https://gateway.pinata.cloud/ipfs/${cid}` };
    }
}
// Helper function to validate and extract wallet address from request headers
function getWalletAddress(req) {
    const walletAddress = req.headers["x-wallet-address"];
    if (!walletAddress || typeof walletAddress !== "string" || walletAddress.trim() === "") {
        return null;
    }
    return walletAddress.toLowerCase();
}
export async function registerRoutes(app) {
    // ============================================
    // AUTH ROUTES
    // ============================================
    app.post("/api/auth/connect", async (req, res) => {
        try {
            const { walletAddress } = req.body;
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address required" });
            }
            const normalizedWalletAddress = walletAddress.toLowerCase();
            let user = await storage.getUserByWalletAddress(normalizedWalletAddress);
            if (!user) {
                // Create new user with UID
                const uid = await generateUID();
                const username = `user_${normalizedWalletAddress.slice(2, 8)}`;
                const isAdmin = normalizedWalletAddress === ADMIN_WALLET_ADDRESS;
                user = await storage.createUser({
                    walletAddress: normalizedWalletAddress,
                    uid,
                    username,
                    role: isAdmin ? "admin" : "patient",
                    status: isAdmin ? "verified" : "pending",
                });
                // Create audit log
                await storage.createAuditLog({
                    userId: user.id,
                    action: "user_registered",
                    targetType: "user",
                    targetId: user.id,
                    metadata: { walletAddress, isAdmin },
                });
            }
            res.json({
                uid: user.uid,
                role: user.role,
                status: user.status,
            });
        }
        catch (error) {
            console.error("Auth error:", error);
            res.status(500).json({ error: "Authentication failed" });
        }
    });
    // ============================================
    // PATIENT ROUTES
    // ============================================
    // Get patient KYC
    app.get("/api/patient/kyc", async (req, res) => {
        try {
            const walletAddress = getWalletAddress(req);
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const kycData = await storage.getKYC(user.id);
            res.json(kycData);
        }
        catch (error) {
            console.error("Failed to fetch KYC:", error);
            res.status(500).json({ error: "Failed to fetch KYC" });
        }
    });
    // Submit KYC
    app.post("/api/patient/kyc", async (req, res) => {
        try {
            const walletAddress = getWalletAddress(req);
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            // Upload KYC documents to IPFS
            const kycDocumentData = {
                ...req.body,
                userId: user.id,
                walletAddress: user.walletAddress,
                submittedAt: new Date().toISOString(),
            };
            const { cid: documentCID } = await uploadJSONToIPFS(kycDocumentData, `kyc_${user.uid}_${Date.now()}.json`);
            const kycData = await storage.createKYC({
                userId: user.id,
                ...req.body,
                documentCID,
                status: "pending",
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "kyc_submitted",
                targetType: "kyc",
                targetId: kycData.id,
                metadata: { documentCID },
            });
            res.json(kycData);
        }
        catch (error) {
            console.error("KYC submission error:", error);
            res.status(500).json({ error: "Failed to submit KYC" });
        }
    });
    // Get health profile (works for all user types)
    app.get("/api/user/health-profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const profile = await storage.getHealthProfile(user.id);
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });
    // Update health profile (works for all user types)
    app.put("/api/user/health-profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const existing = await storage.getHealthProfile(user.id);
            if (existing) {
                await storage.updateHealthProfile(user.id, req.body);
            }
            else {
                await storage.createHealthProfile({
                    userId: user.id,
                    ...req.body,
                });
            }
            await storage.createAuditLog({
                userId: user.id,
                action: "profile_updated",
                targetType: "profile",
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update profile" });
        }
    });
    // Legacy patient routes for backwards compatibility
    app.get("/api/patient/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const profile = await storage.getHealthProfile(user.id);
            res.json(profile);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });
    app.put("/api/patient/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const existing = await storage.getHealthProfile(user.id);
            if (existing) {
                await storage.updateHealthProfile(user.id, req.body);
            }
            else {
                await storage.createHealthProfile({
                    userId: user.id,
                    ...req.body,
                });
            }
            await storage.createAuditLog({
                userId: user.id,
                action: "profile_updated",
                targetType: "profile",
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update profile" });
        }
    });
    // Get user profile (works for all user types)
    app.get("/api/user/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch user profile" });
        }
    });
    // Update user profile (works for all user types)
    app.put("/api/user/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            // Update allowed fields - hospitals cannot change their hospitalName for security
            const allowedFields = user.role === 'hospital' ? ['username', 'email'] : ['username', 'email', 'hospitalName'];
            const updateData = {};
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                }
            }
            if (Object.keys(updateData).length > 0) {
                await storage.updateUserInfo(user.id, updateData);
            }
            await storage.createAuditLog({
                userId: user.id,
                action: "user_profile_updated",
                targetType: "user",
                targetId: user.id,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Profile update error:", error);
            res.status(500).json({ error: "Failed to update user profile" });
        }
    });
    // Upload profile picture - works for all user types
    app.post("/api/user/profile-picture", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const { profilePicture } = req.body;
            // Validation
            if (!profilePicture || typeof profilePicture !== 'string') {
                return res.status(400).json({ error: "Profile picture is required and must be a string (base64 or URL)" });
            }
            // Check size limit (10MB for base64 data URLs)
            if (profilePicture.length > 10 * 1024 * 1024) {
                return res.status(400).json({ error: "Profile picture size exceeds 10MB limit" });
            }
            await storage.updateUserProfilePicture(user.id, profilePicture);
            await storage.createAuditLog({
                userId: user.id,
                action: "profile_picture_updated",
                targetType: "user",
                targetId: user.id,
            });
            res.json({ success: true, profilePicture });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to upload profile picture" });
        }
    });
    // Legacy route for backwards compatibility
    app.post("/api/patient/profile-picture", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const { profilePicture } = req.body;
            if (!profilePicture || typeof profilePicture !== 'string') {
                return res.status(400).json({ error: "Profile picture is required and must be a string (base64 or URL)" });
            }
            if (profilePicture.length > 10 * 1024 * 1024) {
                return res.status(400).json({ error: "Profile picture size exceeds 10MB limit" });
            }
            await storage.updateUserProfilePicture(user.id, profilePicture);
            await storage.createAuditLog({
                userId: user.id,
                action: "profile_picture_updated",
                targetType: "user",
                targetId: user.id,
            });
            res.json({ success: true, profilePicture });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to upload profile picture" });
        }
    });
    // Get medical records
    app.get("/api/patient/records", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const records = await storage.getMedicalRecords(user.id);
            res.json(records);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch records" });
        }
    });
    // Upload medical record
    app.post("/api/patient/records", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            // Upload file to IPFS if fileData is provided
            let fileCID;
            let fileHash;
            if (req.body.fileData) {
                const fileName = req.body.fileName || `medical_record_${Date.now()}`;
                const ipfsResult = await uploadToIPFS(req.body.fileData, fileName, {
                    userId: user.id,
                    recordType: req.body.recordType,
                    uploadedAt: new Date().toISOString(),
                });
                fileCID = ipfsResult.cid;
                fileHash = ipfsResult.hash;
            }
            else {
                // Fallback for metadata-only records
                const recordData = JSON.stringify(req.body);
                fileHash = generateFileHash(recordData);
                fileCID = `metadata_${fileHash.substring(0, 16)}`;
            }
            const encryptionKey = CryptoJS.lib.WordArray.random(32).toString();
            const record = await storage.createMedicalRecord({
                userId: user.id,
                uploadedBy: user.id,
                fileCID,
                fileHash,
                encryptionKey,
                ...req.body,
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "record_added",
                targetType: "record",
                targetId: record.id,
                metadata: { recordType: req.body.recordType, fileCID },
            });
            res.json(record);
        }
        catch (error) {
            console.error("Medical record upload error:", error);
            res.status(500).json({ error: "Failed to upload record" });
        }
    });
    // Get emergency QR
    app.get("/api/patient/qr", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const qr = await storage.getEmergencyQR(user.id);
            res.json(qr);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch QR" });
        }
    });
    // Generate emergency QR - works for all user types
    app.post("/api/user/qr", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            // Get health profile for emergency details (if available)
            const healthProfile = await storage.getHealthProfile(user.id);
            // Get KYC info for hospital name
            const kycData = await storage.getKYC(user.id);
            const qrData = JSON.stringify({
                username: user.username,
                uid: user.uid,
                walletAddress: user.walletAddress,
                role: user.role,
                hospitalName: user.hospitalName || kycData?.institutionName || null,
                emergencyDetails: healthProfile ? {
                    bloodType: healthProfile.bloodType,
                    allergies: healthProfile.allergies,
                    chronicConditions: healthProfile.chronicConditions,
                    currentMedications: healthProfile.currentMedications,
                    emergencyContact: healthProfile.emergencyContact,
                    emergencyPhone: healthProfile.emergencyPhone,
                } : null,
                timestamp: Date.now(),
            });
            const qr = await storage.createEmergencyQR({
                userId: user.id,
                qrData,
                signedToken: req.body.signature || "simulated_signature",
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "qr_generated",
                targetType: "qr",
                targetId: qr.id,
            });
            res.json(qr);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to generate QR" });
        }
    });
    // Legacy route for backwards compatibility
    app.post("/api/patient/qr", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const healthProfile = await storage.getHealthProfile(user.id);
            const kycData = await storage.getKYC(user.id);
            const qrData = JSON.stringify({
                username: user.username,
                uid: user.uid,
                walletAddress: user.walletAddress,
                role: user.role,
                hospitalName: user.hospitalName || kycData?.institutionName || null,
                emergencyDetails: healthProfile ? {
                    bloodType: healthProfile.bloodType,
                    allergies: healthProfile.allergies,
                    chronicConditions: healthProfile.chronicConditions,
                    currentMedications: healthProfile.currentMedications,
                    emergencyContact: healthProfile.emergencyContact,
                    emergencyPhone: healthProfile.emergencyPhone,
                } : null,
                timestamp: Date.now(),
            });
            const qr = await storage.createEmergencyQR({
                userId: user.id,
                qrData,
                signedToken: req.body.signature || "simulated_signature",
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "qr_generated",
                targetType: "qr",
                targetId: qr.id,
            });
            res.json(qr);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to generate QR" });
        }
    });
    // Get access requests
    app.get("/api/patient/access-requests", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const requests = await storage.getAccessRequests(user.id);
            // Enrich with requester info
            const enriched = await Promise.all(requests.map(async (req) => {
                const requester = await storage.getUser(req.requesterId);
                return {
                    ...req,
                    requesterName: requester?.username,
                    requesterRole: requester?.role,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch access requests" });
        }
    });
    // Get granted access
    app.get("/api/patient/access-granted", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const granted = await storage.getGrantedAccess(user.id);
            const enriched = await Promise.all(granted.map(async (acc) => {
                const requester = await storage.getUser(acc.requesterId);
                return {
                    ...acc,
                    requesterName: requester?.username,
                    requesterRole: requester?.role,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch granted access" });
        }
    });
    // Approve access request
    app.post("/api/patient/access-requests/:id/approve", async (req, res) => {
        try {
            const { id } = req.params;
            console.log(`[Approve Access] Approving access request ${id}, setting status to 'granted'`);
            await storage.updateAccessStatus(id, "granted");
            await storage.createAuditLog({
                action: "access_granted",
                targetType: "access",
                targetId: id,
            });
            console.log(`[Approve Access] Successfully approved access request ${id}`);
            res.json({ success: true });
        }
        catch (error) {
            console.error("[Approve Access] Error approving access:", error);
            res.status(500).json({ error: "Failed to approve access" });
        }
    });
    // Reject access request
    app.post("/api/patient/access-requests/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            await storage.updateAccessStatus(id, "rejected");
            await storage.createAuditLog({
                action: "access_rejected",
                targetType: "access",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to reject access" });
        }
    });
    // Revoke access
    app.post("/api/patient/access/:id/revoke", async (req, res) => {
        try {
            const { id } = req.params;
            await storage.updateAccessStatus(id, "revoked");
            await storage.createAuditLog({
                action: "access_revoked",
                targetType: "access",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to revoke access" });
        }
    });
    // Get patient insurance connections
    app.get("/api/patient/insurance", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const connections = await storage.getPatientInsuranceConnections(user.id);
            res.json(connections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch insurance connections" });
        }
    });
    // Get patient claims
    app.get("/api/patient/claims", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const claims = await storage.getClaims({ patientId: user.id });
            res.json(claims);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch claims" });
        }
    });
    // Approve claim (patient approval)
    app.post("/api/patient/claims/:id/approve", async (req, res) => {
        try {
            const { id } = req.params;
            const { note } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            await storage.approveClaimByPatient(id, note);
            await storage.createAuditLog({
                userId: user.id,
                action: "claim_approved_by_patient",
                targetType: "claim",
                targetId: id,
                metadata: { note },
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to approve claim" });
        }
    });
    // Reject claim (patient rejection)
    app.post("/api/patient/claims/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            const { note } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            await storage.rejectClaimByPatient(id, note);
            await storage.createAuditLog({
                userId: user.id,
                action: "claim_rejected_by_patient",
                targetType: "claim",
                targetId: id,
                metadata: { note },
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to reject claim" });
        }
    });
    // Get patient audit logs
    app.get("/api/patient/audit-logs", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const logs = await storage.getAuditLogs(user.id);
            res.json(logs);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch audit logs" });
        }
    });
    // Verify and record subscription payment
    app.post("/api/patient/subscription-payment", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            if (!walletAddress) {
                console.error("[Subscription Payment] No wallet address provided");
                return res.status(400).json({ error: "Wallet address is required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user) {
                console.error("[Subscription Payment] User not found for wallet:", walletAddress);
                return res.status(404).json({ error: "User not found" });
            }
            const { transactionHash, role, amount } = req.body;
            console.log("[Subscription Payment] Processing payment:", {
                userId: user.id,
                role,
                amount,
                txHashLength: transactionHash?.length
            });
            if (!transactionHash || !role) {
                console.error("[Subscription Payment] Missing required fields:", { transactionHash: !!transactionHash, role: !!role });
                return res.status(400).json({ error: "Transaction hash and role are required" });
            }
            // Check if transaction hash already exists
            const existing = await storage.getSubscriptionPaymentByTxHash(transactionHash);
            if (existing) {
                console.error("[Subscription Payment] Duplicate transaction hash:", transactionHash);
                return res.status(400).json({ error: "Transaction already recorded" });
            }
            // In production, you would verify the transaction on the blockchain here
            // For now, we'll simulate verification by checking the transaction hash format
            if (!transactionHash.startsWith('0x') || transactionHash.length !== 66) {
                console.error("[Subscription Payment] Invalid transaction hash format:", {
                    starts: transactionHash.startsWith('0x'),
                    length: transactionHash.length
                });
                return res.status(400).json({ error: "Invalid transaction hash format" });
            }
            // Create subscription payment record
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            const paymentData = {
                userId: user.id,
                kycId: null,
                role,
                amount: amount || "2",
                transactionHash,
                fromAddress: walletAddress.toLowerCase(),
                toAddress: ADMIN_WALLET_ADDRESS,
                status: "confirmed",
                expiresAt: oneYearFromNow,
            };
            console.log("[Subscription Payment] Creating payment record:", paymentData);
            const payment = await storage.createSubscriptionPayment(paymentData);
            console.log("[Subscription Payment] Payment created successfully:", payment.id);
            await storage.createAuditLog({
                userId: user.id,
                action: "subscription_payment_made",
                targetType: "payment",
                metadata: { role, amount: amount || "2", transactionHash },
            });
            res.json({ success: true, expiresAt: oneYearFromNow });
        }
        catch (error) {
            console.error("[Subscription Payment] ERROR:", {
                message: error.message,
                stack: error.stack,
                code: error.code,
                detail: error.detail
            });
            res.status(500).json({
                error: "Failed to process subscription payment",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
    // Apply for role
    app.post("/api/patient/apply-role", async (req, res) => {
        try {
            const walletAddress = getWalletAddress(req);
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const requestedRole = req.body.role;
            // Check if subscription payment is required and has been made
            if (requestedRole === "hospital" || requestedRole === "insurance_provider") {
                const hasActiveSubscription = await storage.checkActiveSubscription(user.id, requestedRole);
                if (!hasActiveSubscription) {
                    return res.status(402).json({
                        error: "Subscription payment required",
                        message: "Please complete the 2 BDAG annual subscription payment before submitting your application"
                    });
                }
            }
            // Create a role application KYC entry
            const kycData = await storage.createKYC({
                userId: user.id,
                fullName: req.body.fullName || `${req.body.role} Application`,
                professionalLicense: req.body.professionalLicense || "",
                institutionName: req.body.institutionName || "",
                selectedHospital: req.body.selectedHospital || "",
                country: req.body.country || "",
                state: req.body.state || "",
                location: req.body.location || "",
                hospitalProfile: req.body.hospitalProfile || "",
                providerName: req.body.providerName || "",
                providerDescription: req.body.providerDescription || "",
                monthlyFee: req.body.monthlyFee || null,
                coverageLimit: req.body.coverageLimit || null,
                coverageTypes: req.body.coverageTypes || [],
                requestedRole: req.body.role,
                status: "pending",
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "role_application_submitted",
                targetType: "user",
                targetId: user.id,
                metadata: { requestedRole: req.body.role },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Apply role error:", error);
            res.status(500).json({ error: "Failed to submit application" });
        }
    });
    // Get current user data
    app.get("/api/user/me", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            res.json({
                id: user.id,
                uid: user.uid,
                username: user.username,
                walletAddress: user.walletAddress,
                role: user.role,
                status: user.status,
                profilePicture: user.profilePicture,
                hospitalName: user.hospitalName,
            });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch user data" });
        }
    });
    // Update user info (hospital name, username, etc.)
    app.put("/api/user/info", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const { username, hospitalName } = req.body;
            const updateData = {};
            if (username)
                updateData.username = username;
            if (hospitalName !== undefined)
                updateData.hospitalName = hospitalName;
            await storage.updateUserInfo(user.id, updateData);
            await storage.createAuditLog({
                userId: user.id,
                action: "user_info_updated",
                targetType: "user",
                targetId: user.id,
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update user info" });
        }
    });
    // Get emergency QR for any user
    app.get("/api/user/qr", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const qr = await storage.getEmergencyQR(user.id);
            res.json(qr);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch QR" });
        }
    });
    // Create enhanced access request with proof (for doctors/emergency responders)
    app.post("/api/user/request-access", async (req, res) => {
        try {
            const { patientId, reason, isEmergency, proofImage, proofDetails } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            console.log("[Request Access] Received request:", { patientId, reason, isEmergency, walletAddress });
            if (!patientId) {
                return res.status(400).json({ error: "Patient ID is required" });
            }
            if (!walletAddress) {
                return res.status(401).json({ error: "Wallet address required" });
            }
            const requester = await storage.getUserByWalletAddress(walletAddress);
            console.log("[Request Access] Requester:", requester?.id, requester?.role);
            if (!requester)
                return res.status(404).json({ error: "Requester not found" });
            // Get patient to find their hospital if they have one
            const patient = await storage.getUser(patientId);
            console.log("[Request Access] Patient:", patient?.id, patient?.username);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            // Determine if hospital should be notified (convert to boolean)
            const shouldNotifyHospital = !!(isEmergency && patient.hospitalName);
            console.log("[Request Access] Hospital notification check:", { isEmergency, hospitalName: patient.hospitalName, shouldNotifyHospital, type: typeof shouldNotifyHospital });
            const accessData = {
                patientId,
                requesterId: requester.id,
                accessType: isEmergency ? "emergency_only" : "full",
                reason,
                status: "pending",
                isEmergency: isEmergency || false,
                proofImage: proofImage || null,
                proofDetails: proofDetails || null,
                hospitalNotified: shouldNotifyHospital || false,
            };
            console.log("[Request Access] Access data being sent to DB:", JSON.stringify(accessData, null, 2));
            const accessRequest = await storage.createAccessRequest(accessData);
            console.log("[Request Access] Created access request:", accessRequest.id);
            await storage.createAuditLog({
                userId: requester.id,
                action: isEmergency ? "emergency_access_requested" : "access_requested",
                targetType: "access",
                targetId: accessRequest.id,
                metadata: { patientId, reason, isEmergency, hospitalNotified: shouldNotifyHospital },
            });
            // If emergency and patient has a hospital, create notification (would be implemented later)
            if (shouldNotifyHospital) {
                await storage.createAuditLog({
                    userId: requester.id,
                    action: "hospital_notified_emergency",
                    targetType: "access",
                    targetId: accessRequest.id,
                    metadata: {
                        patientId,
                        requesterId: requester.id,
                        hospitalName: patient.hospitalName
                    },
                });
            }
            res.json(accessRequest);
        }
        catch (error) {
            console.error("[Request Access Error]", error);
            console.error("[Request Access Error Stack]", error.stack);
            res.status(500).json({ error: error.message || "Failed to request access" });
        }
    });
    // ============================================
    // DOCTOR ROUTES
    // ============================================
    // Search for patient
    app.get("/api/doctor/search", async (req, res) => {
        try {
            const { query } = req.query;
            if (!query || !query.trim()) {
                return res.status(400).json({ error: "Search query is required" });
            }
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            let patient = await storage.getUserByUid(query.trim());
            if (!patient) {
                patient = await storage.getUserByUsername(query.trim());
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only search for patients" });
            }
            const records = await storage.getMedicalRecords(patient.id);
            const hasAccess = await storage.checkAccess(patient.id, doctor.id);
            res.json({
                id: patient.id,
                username: patient.username,
                uid: patient.uid,
                status: patient.status,
                recordCount: records.length,
                hasAccess,
            });
        }
        catch (error) {
            console.error("Doctor search error:", error);
            res.status(500).json({ error: "Search failed" });
        }
    });
    // Request access to patient records
    app.post("/api/doctor/request-access", async (req, res) => {
        try {
            const { patientId, reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            const accessRequest = await storage.createAccessRequest({
                patientId,
                requesterId: doctor.id,
                accessType: "full",
                reason,
                status: "pending",
            });
            await storage.createAuditLog({
                userId: doctor.id,
                action: "access_requested",
                targetType: "access",
                targetId: accessRequest.id,
                metadata: { patientId, reason },
            });
            res.json(accessRequest);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to request access" });
        }
    });
    // Get doctor's access requests
    app.get("/api/doctor/access-requests", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            const requests = await storage.getAccessRequestsByRequester(doctor.id);
            const enriched = await Promise.all(requests.map(async (req) => {
                const patient = await storage.getUser(req.patientId);
                return {
                    ...req,
                    patientUid: patient?.uid,
                    patientUsername: patient?.username,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch access requests" });
        }
    });
    // Get doctor's treatment logs
    app.get("/api/doctor/treatments", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            const treatments = await storage.getTreatmentLogs(undefined, doctor.id);
            res.json(treatments);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch treatments" });
        }
    });
    // Create treatment log (doctor)
    app.post("/api/doctor/treatments", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            if (doctor.role !== "doctor") {
                return res.status(403).json({ error: "Only doctors can create treatment logs" });
            }
            const treatmentSchema = z.object({
                patientId: z.string().min(1, "Patient ID is required"),
                hospitalId: z.string().optional(),
                diagnosis: z.string().min(1, "Diagnosis is required"),
                treatment: z.string().min(1, "Treatment is required"),
                prescription: z.string().optional(),
                notes: z.string().optional(),
                treatmentDate: z.coerce.date(),
                treatmentFiles: z.array(z.object({
                    name: z.string().max(255, "File name too long"),
                    type: z.string().refine((type) => {
                        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
                            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                        return allowedTypes.includes(type);
                    }, "Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX are allowed"),
                    data: z.string().refine((data) => {
                        if (!data.startsWith('data:'))
                            return false;
                        const sizeInBytes = Math.ceil((data.length - data.indexOf(',') - 1) * 0.75);
                        return sizeInBytes <= 10 * 1024 * 1024;
                    }, "File size exceeds 10MB limit"),
                })).max(5, "Maximum 5 files allowed").optional(),
            });
            const validatedData = treatmentSchema.parse(req.body);
            // Try to find patient by ID, UID, or username (flexible lookup)
            let patient = await storage.getUser(validatedData.patientId);
            if (!patient) {
                patient = await storage.getUserByUid(validatedData.patientId);
            }
            if (!patient) {
                patient = await storage.getUserByUsername(validatedData.patientId);
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found. Please provide a valid Patient ID, UID, or username." });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only create treatment logs for patients" });
            }
            // Use the actual patient.id for all subsequent operations
            const hasAccess = await storage.checkAccess(patient.id, doctor.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to create treatment logs for this patient." });
            }
            // Try to find hospital by ID, UID, or username (flexible lookup) if provided
            let hospitalId = null;
            if (validatedData.hospitalId) {
                let hospital = await storage.getUser(validatedData.hospitalId);
                if (!hospital) {
                    hospital = await storage.getUserByUid(validatedData.hospitalId);
                }
                if (!hospital) {
                    hospital = await storage.getUserByUsername(validatedData.hospitalId);
                }
                if (hospital) {
                    if (hospital.role !== "hospital") {
                        return res.status(400).json({ error: "Invalid hospital ID - must be a hospital user" });
                    }
                    hospitalId = hospital.id;
                }
            }
            // If no hospital ID provided, check if patient has an active admission
            if (!hospitalId) {
                const allAdmissions = await storage.getPatientAdmissions({});
                const patientAdmissions = allAdmissions.filter(a => a.patientId === patient.id &&
                    a.doctorId === doctor.id &&
                    (a.status === "admitted" || a.status === "treated"));
                if (patientAdmissions.length > 0) {
                    // Use the most recent admission's hospital
                    const latestAdmission = patientAdmissions.sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())[0];
                    hospitalId = latestAdmission.hospitalId;
                }
            }
            const signatureData = `${patient.id}-${validatedData.treatmentDate.toISOString()}-${validatedData.diagnosis}`;
            const doctorSignature = CryptoJS.HmacSHA256(signatureData, doctor.walletAddress).toString();
            const signatureHash = CryptoJS.SHA256(doctorSignature).toString();
            // Upload treatment record to IPFS
            const treatmentData = {
                patientId: patient.id,
                doctorId: doctor.id,
                hospitalId: hospitalId,
                diagnosis: validatedData.diagnosis,
                treatment: validatedData.treatment,
                prescription: validatedData.prescription || null,
                notes: validatedData.notes || null,
                treatmentDate: validatedData.treatmentDate.toISOString(),
                doctorSignature,
                signatureHash,
                treatmentFiles: validatedData.treatmentFiles || null,
            };
            const { cid: recordCID } = await uploadJSONToIPFS(treatmentData, `treatment_${patient.uid}_${Date.now()}.json`);
            const treatmentLog = await storage.createTreatmentLog({
                patientId: patient.id,
                doctorId: doctor.id,
                hospitalId: hospitalId,
                diagnosis: validatedData.diagnosis,
                treatment: validatedData.treatment,
                prescription: validatedData.prescription || null,
                notes: validatedData.notes || null,
                treatmentDate: validatedData.treatmentDate,
                recordCID,
                doctorSignature,
                signatureHash,
                treatmentFiles: validatedData.treatmentFiles || null,
            });
            // Create a medical record for this treatment
            const medicalRecordTitle = `Treatment: ${validatedData.diagnosis}`;
            const medicalRecordDescription = `${validatedData.treatment}${validatedData.prescription ? `\nPrescription: ${validatedData.prescription}` : ''}${validatedData.notes ? `\nNotes: ${validatedData.notes}` : ''}`;
            const medicalRecordData = {
                userId: patient.id,
                title: medicalRecordTitle,
                description: medicalRecordDescription,
                recordType: "treatment",
                fileCID: recordCID,
                fileHash: signatureHash,
                fileName: null,
                fileType: null,
                fileData: null,
                isEmergency: false,
                uploadedBy: doctor.id,
                encryptionKey: null,
            };
            await storage.createMedicalRecord(medicalRecordData);
            // Mark patient admission as treated if there's an active admission
            if (hospitalId) {
                const currentAdmission = await storage.getCurrentAdmission(patient.id, hospitalId);
                if (currentAdmission && currentAdmission.status === "admitted") {
                    await storage.updatePatientAdmissionStatus(currentAdmission.id, "treated");
                }
            }
            await storage.createAuditLog({
                userId: doctor.id,
                action: "doctor_treatment_created",
                targetType: "treatment",
                targetId: treatmentLog.id,
                metadata: { patientId: patient.id, diagnosis: validatedData.diagnosis },
            });
            res.status(201).json(treatmentLog);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Treatment validation error:", error.errors);
                return res.status(400).json({ error: "Invalid treatment data", details: error.errors });
            }
            console.error("Treatment creation error:", error);
            res.status(500).json({ error: "Failed to create treatment log" });
        }
    });
    // Get doctor's patients with granted access and assigned patients from admissions
    app.get("/api/doctor/patients", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            // Get all access requests for this doctor with granted status
            const accessRequests = await storage.getAccessRequestsByRequester(doctor.id);
            console.log(`[Doctor Patients] Doctor ${doctor.id} has ${accessRequests.length} total access requests`);
            console.log(`[Doctor Patients] Access request statuses:`, accessRequests.map(req => req.status));
            const grantedAccess = accessRequests.filter(req => req.status === "granted");
            console.log(`[Doctor Patients] Found ${grantedAccess.length} granted access requests`);
            // Get patients assigned to this doctor via admissions
            const assignedAdmissions = await storage.getPatientAdmissions({});
            const doctorAdmissions = assignedAdmissions.filter(admission => admission.doctorId === doctor.id);
            // Create a map to track unique patients
            const patientMap = new Map();
            // Add patients from granted access
            for (const access of grantedAccess) {
                const patient = await storage.getUser(access.patientId);
                const records = await storage.getMedicalRecords(access.patientId);
                const treatments = await storage.getTreatmentLogs(access.patientId, doctor.id);
                const admission = doctorAdmissions.find(a => a.patientId === access.patientId);
                patientMap.set(access.patientId, {
                    id: patient?.id,
                    uid: patient?.uid,
                    username: patient?.username,
                    status: patient?.status,
                    profilePicture: patient?.profilePicture,
                    accessGrantedAt: access.respondedAt,
                    accessType: access.accessType,
                    recordCount: records.length,
                    treatmentCount: treatments.length,
                    admissionStatus: admission?.status,
                    isAssigned: !!admission,
                });
            }
            // Add patients from admissions who might not have granted access yet
            for (const admission of doctorAdmissions) {
                if (!patientMap.has(admission.patientId)) {
                    const patient = await storage.getUser(admission.patientId);
                    const records = await storage.getMedicalRecords(admission.patientId);
                    const treatments = await storage.getTreatmentLogs(admission.patientId, doctor.id);
                    patientMap.set(admission.patientId, {
                        id: patient?.id,
                        uid: patient?.uid,
                        username: patient?.username,
                        status: patient?.status,
                        profilePicture: patient?.profilePicture,
                        recordCount: records.length,
                        treatmentCount: treatments.length,
                        admissionStatus: admission.status,
                        isAssigned: true,
                    });
                }
            }
            res.json(Array.from(patientMap.values()));
        }
        catch (error) {
            console.error("Failed to fetch doctor's patients:", error);
            res.status(500).json({ error: "Failed to fetch patients" });
        }
    });
    // Get specific patient's records for doctor (with access check)
    app.get("/api/doctor/patient/:patientId/records", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            // Check if doctor has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, doctor.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's records." });
            }
            const records = await storage.getMedicalRecords(patientId);
            res.json(records);
        }
        catch (error) {
            console.error("Failed to fetch patient records:", error);
            res.status(500).json({ error: "Failed to fetch records" });
        }
    });
    // Get specific patient's health profile for doctor (with access check)
    app.get("/api/doctor/patient/:patientId/profile", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            // Check if doctor has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, doctor.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's profile." });
            }
            const patient = await storage.getUser(patientId);
            const profile = await storage.getHealthProfile(patientId);
            res.json({
                ...patient,
                healthProfile: profile,
            });
        }
        catch (error) {
            console.error("Failed to fetch patient profile:", error);
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });
    // ============================================
    // HOSPITAL ROUTES
    // ============================================
    // Get hospital claims
    app.get("/api/hospital/claims", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            const claims = await storage.getClaims({ hospitalId: hospital.id });
            res.json(claims);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch claims" });
        }
    });
    // Get patient's insurance connections (for hospitals to submit claims)
    app.get("/api/hospital/patients/:patientId/insurance", async (req, res) => {
        try {
            const { patientId } = req.params;
            console.log("[Insurance Lookup] Received patient UID:", patientId);
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            if (hospital.role !== "hospital") {
                return res.status(403).json({ error: "Only hospitals can access this endpoint" });
            }
            const patient = await storage.getUserByUid(patientId);
            console.log("[Insurance Lookup] Patient found:", patient ? { id: patient.id, uid: patient.uid, username: patient.username } : "Not found");
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            const connections = await storage.getPatientInsuranceConnections(patient.id);
            console.log("[Insurance Lookup] Found connections:", connections.length, "connections");
            console.log("[Insurance Lookup] Connection details:", connections.map(c => ({
                id: c.id,
                status: c.status,
                providerName: c.providerName
            })));
            res.json(connections);
        }
        catch (error) {
            console.error("Error fetching patient insurance:", error);
            res.status(500).json({ error: "Failed to fetch patient insurance connections" });
        }
    });
    // Submit insurance claim
    app.post("/api/hospital/claims", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            if (hospital.role !== "hospital") {
                return res.status(403).json({ error: "Only hospitals can submit claims" });
            }
            const claimSchema = insertClaimSchema.omit({ hospitalId: true, treatmentLogId: true });
            const validatedData = claimSchema.parse(req.body);
            // Look up the patient by their UID first
            const patient = await storage.getUserByUid(validatedData.patientId);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            // Validate that the connection belongs to the patient
            const connections = await storage.getPatientInsuranceConnections(patient.id);
            const connection = connections.find(c => c.id === validatedData.connectionId);
            if (!connection) {
                return res.status(400).json({ error: "Invalid insurance connection. The patient is not connected to this insurance provider." });
            }
            if (connection.status !== "connected") {
                return res.status(400).json({ error: "Insurance connection is not active" });
            }
            const claim = await storage.createClaim({
                ...validatedData,
                patientId: patient.id,
                hospitalId: hospital.id,
                status: "pending",
            });
            res.status(201).json(claim);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Claim validation error:", error.errors);
                return res.status(400).json({ error: "Invalid claim data", details: error.errors });
            }
            console.error("Claim submission error:", error);
            res.status(500).json({ error: "Failed to submit claim" });
        }
    });
    // Create treatment log (hospital)
    app.post("/api/hospital/treatments", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            if (hospital.role !== "hospital") {
                return res.status(403).json({ error: "Only hospitals can create treatment logs" });
            }
            const treatmentSchema = z.object({
                patientId: z.string().min(1, "Patient ID is required"),
                doctorId: z.string().optional(),
                diagnosis: z.string().min(1, "Diagnosis is required"),
                treatment: z.string().min(1, "Treatment is required"),
                prescription: z.string().optional(),
                notes: z.string().optional(),
                treatmentDate: z.coerce.date(),
            });
            const validatedData = treatmentSchema.parse(req.body);
            // Try to find patient by ID, UID, or username (flexible lookup)
            let patient = await storage.getUser(validatedData.patientId);
            if (!patient) {
                patient = await storage.getUserByUid(validatedData.patientId);
            }
            if (!patient) {
                patient = await storage.getUserByUsername(validatedData.patientId);
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found. Please provide a valid Patient ID, UID, or username." });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only create treatment logs for patients" });
            }
            // Use the actual patient.id for access check
            const hasAccess = await storage.checkAccess(patient.id, hospital.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to create treatment logs for this patient." });
            }
            let doctor = null;
            if (validatedData.doctorId) {
                // Try to find doctor by ID, UID, or username
                doctor = await storage.getUser(validatedData.doctorId);
                if (!doctor) {
                    doctor = await storage.getUserByUid(validatedData.doctorId);
                }
                if (!doctor) {
                    doctor = await storage.getUserByUsername(validatedData.doctorId);
                }
                if (!doctor || doctor.role !== "doctor") {
                    return res.status(400).json({ error: "Invalid doctor ID" });
                }
                if (doctor.hospitalName !== hospital.hospitalName) {
                    return res.status(403).json({ error: "Doctor must be affiliated with this hospital" });
                }
            }
            const signatureData = `${patient.id}-${validatedData.treatmentDate.toISOString()}-${validatedData.diagnosis}`;
            const signatureKey = doctor?.walletAddress || hospital.walletAddress;
            const doctorSignature = CryptoJS.HmacSHA256(signatureData, signatureKey).toString();
            const signatureHash = CryptoJS.SHA256(doctorSignature).toString();
            // Upload treatment record to IPFS
            const treatmentData = {
                patientId: patient.id,
                doctorId: doctor?.id || hospital.id,
                hospitalId: hospital.id,
                diagnosis: validatedData.diagnosis,
                treatment: validatedData.treatment,
                prescription: validatedData.prescription || null,
                notes: validatedData.notes || null,
                treatmentDate: validatedData.treatmentDate.toISOString(),
                doctorSignature,
                signatureHash,
            };
            const { cid: recordCID } = await uploadJSONToIPFS(treatmentData, `treatment_${patient.uid}_${Date.now()}.json`);
            const treatmentLog = await storage.createTreatmentLog({
                patientId: patient.id,
                doctorId: doctor?.id || hospital.id,
                hospitalId: hospital.id,
                diagnosis: validatedData.diagnosis,
                treatment: validatedData.treatment,
                prescription: validatedData.prescription || null,
                notes: validatedData.notes || null,
                treatmentDate: validatedData.treatmentDate,
                recordCID,
                doctorSignature,
                signatureHash,
            });
            await storage.createAuditLog({
                userId: hospital.id,
                action: "hospital_treatment_created",
                targetType: "treatment",
                targetId: treatmentLog.id,
                metadata: {
                    patientId: patient.id,
                    diagnosis: validatedData.diagnosis,
                    doctorId: validatedData.doctorId || null,
                },
            });
            res.status(201).json(treatmentLog);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Treatment validation error:", error.errors);
                return res.status(400).json({ error: "Invalid treatment data", details: error.errors });
            }
            console.error("Treatment creation error:", error);
            res.status(500).json({ error: "Failed to create treatment log" });
        }
    });
    // Get hospital treatment logs
    app.get("/api/hospital/treatments", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            const allTreatments = await storage.getTreatmentLogs();
            const hospitalTreatments = allTreatments.filter(t => t.hospitalId === hospital.id);
            res.json(hospitalTreatments);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch treatments" });
        }
    });
    // Search hospital patients
    app.get("/api/hospital/search-patient", async (req, res) => {
        try {
            const { query } = req.query;
            if (!query || !query.trim()) {
                return res.status(400).json({ error: "Search query is required" });
            }
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            let patient = await storage.getUserByUid(query.trim());
            if (!patient) {
                patient = await storage.getUserByUsername(query.trim());
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only search for patients" });
            }
            // Get patient's treatment logs with this hospital
            const treatments = await storage.getTreatmentLogs(patient.id);
            const hospitalTreatments = treatments.filter(t => t.hospitalId === hospital.id);
            // Get patient's claims with this hospital
            const patientClaims = await storage.getClaims({ patientId: patient.id, hospitalId: hospital.id });
            res.json({
                id: patient.id,
                uid: patient.uid,
                username: patient.username,
                status: patient.status,
                profilePicture: patient.profilePicture,
                treatmentCount: hospitalTreatments.length,
                claimCount: patientClaims.length,
                lastVisit: hospitalTreatments.length > 0 ? hospitalTreatments[0].treatmentDate : null,
            });
        }
        catch (error) {
            console.error("Hospital search error:", error);
            res.status(500).json({ error: "Search failed" });
        }
    });
    // Get hospital patients (both admitted and treated patients)
    app.get("/api/hospital/patients", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            // Get all admissions for this hospital
            const admissions = await storage.getPatientAdmissions({ hospitalId: hospital.id });
            // Get all treatment logs for this hospital
            const allTreatments = await storage.getTreatmentLogs();
            const hospitalTreatments = allTreatments.filter(t => t.hospitalId === hospital.id);
            // Combine patient IDs from both admissions and treatments
            const admittedPatientIds = admissions.map(a => a.patientId);
            const treatedPatientIds = hospitalTreatments.map(t => t.patientId);
            const allPatientIds = Array.from(new Set([...admittedPatientIds, ...treatedPatientIds]));
            // Fetch patient details with their admission and treatment info
            const patients = await Promise.all(allPatientIds.map(async (patientId) => {
                const patient = await storage.getUser(patientId);
                const patientAdmissions = admissions.filter(a => a.patientId === patientId);
                const currentAdmission = patientAdmissions.find(a => a.status === "admitted" || a.status === "treated");
                const patientTreatments = hospitalTreatments.filter(t => t.patientId === patientId);
                const latestTreatment = patientTreatments.sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())[0];
                // Get assigned doctor info if available
                let assignedDoctor = null;
                if (currentAdmission?.doctorId) {
                    const doctor = await storage.getUser(currentAdmission.doctorId);
                    assignedDoctor = doctor ? {
                        id: doctor.id,
                        uid: doctor.uid,
                        username: doctor.username,
                    } : null;
                }
                return {
                    id: patient?.id,
                    uid: patient?.uid,
                    username: patient?.username,
                    profilePicture: patient?.profilePicture,
                    lastVisit: latestTreatment?.treatmentDate,
                    treatmentCount: patientTreatments.length,
                    status: patient?.status,
                    admissionStatus: currentAdmission?.status,
                    admissionId: currentAdmission?.id,
                    admissionDate: currentAdmission?.admissionDate,
                    admissionReason: currentAdmission?.admissionReason,
                    roomNumber: currentAdmission?.roomNumber,
                    ward: currentAdmission?.ward,
                    assignedDoctor,
                    isTreated: currentAdmission?.status === "treated" || patientTreatments.length > 0,
                    isAdmitted: currentAdmission?.status === "admitted",
                };
            }));
            res.json(patients.filter(p => p.id)); // Filter out any null patients
        }
        catch (error) {
            console.error("Failed to fetch hospital patients:", error);
            res.status(500).json({ error: "Failed to fetch patients" });
        }
    });
    // Get hospital emergency access requests
    app.get("/api/hospital/access-requests", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            // Enforce role-based access control
            if (hospital.role !== "hospital") {
                return res.status(403).json({ error: "Access denied: Hospital role required" });
            }
            if (!hospital.hospitalName) {
                return res.json([]);
            }
            // Get all emergency access requests for patients at this hospital
            const requests = await storage.getHospitalNotifiedAccessRequests(hospital.hospitalName);
            // Enrich with patient and requester info
            const enriched = await Promise.all(requests.map(async (req) => {
                const patient = await storage.getUser(req.patientId);
                const requester = await storage.getUser(req.requesterId);
                return {
                    ...req,
                    patientName: patient?.username,
                    patientUid: patient?.uid,
                    patientProfilePicture: patient?.profilePicture,
                    requesterName: requester?.username,
                    requesterRole: requester?.role,
                    requesterProfilePicture: requester?.profilePicture,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            console.error("Failed to fetch hospital access requests:", error);
            res.status(500).json({ error: "Failed to fetch access requests" });
        }
    });
    // Hospital request access to patient records
    app.post("/api/hospital/request-access", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            if (hospital.role !== "hospital") {
                return res.status(403).json({ error: "Only hospitals can request access" });
            }
            const requestSchema = z.object({
                patientId: z.string().min(1, "Patient ID is required"),
                reason: z.string().min(1, "Reason is required"),
            });
            const validatedData = requestSchema.parse(req.body);
            // Try to find patient by ID, UID, or username (flexible lookup)
            let patient = await storage.getUser(validatedData.patientId);
            if (!patient) {
                patient = await storage.getUserByUid(validatedData.patientId);
            }
            if (!patient) {
                patient = await storage.getUserByUsername(validatedData.patientId);
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found. Please provide a valid Patient ID, UID, or username." });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only request access to patient records" });
            }
            const accessRequest = await storage.createAccessRequest({
                patientId: patient.id,
                requesterId: hospital.id,
                accessType: "full",
                reason: validatedData.reason,
                status: "pending",
            });
            await storage.createAuditLog({
                userId: hospital.id,
                action: "access_requested",
                targetType: "access",
                targetId: accessRequest.id,
                metadata: { patientId: patient.id, reason: validatedData.reason },
            });
            res.json(accessRequest);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: "Invalid request data", details: error.errors });
            }
            console.error("Access request error:", error);
            res.status(500).json({ error: "Failed to request access" });
        }
    });
    // Get hospital's patients with granted access
    app.get("/api/hospital/patients-with-access", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            // Get all access requests for this hospital with granted status
            const accessRequests = await storage.getAccessRequestsByRequester(hospital.id);
            console.log(`[Hospital Patients] Hospital ${hospital.id} has ${accessRequests.length} total access requests`);
            console.log(`[Hospital Patients] Access request statuses:`, accessRequests.map(req => req.status));
            const grantedAccess = accessRequests.filter(req => req.status === "granted");
            console.log(`[Hospital Patients] Found ${grantedAccess.length} granted access requests`);
            // Enrich with patient data
            const patients = await Promise.all(grantedAccess.map(async (access) => {
                const patient = await storage.getUser(access.patientId);
                const records = await storage.getMedicalRecords(access.patientId);
                const allTreatments = await storage.getTreatmentLogs(access.patientId);
                const hospitalTreatments = allTreatments.filter(t => t.hospitalId === hospital.id);
                const allClaims = await storage.getClaims({ patientId: access.patientId });
                const hospitalClaims = allClaims.filter(c => c.hospitalId === hospital.id);
                return {
                    id: patient?.id,
                    uid: patient?.uid,
                    username: patient?.username,
                    status: patient?.status,
                    profilePicture: patient?.profilePicture,
                    accessGrantedAt: access.respondedAt,
                    accessType: access.accessType,
                    recordCount: records.length,
                    treatmentCount: hospitalTreatments.length,
                    claimCount: hospitalClaims.length,
                };
            }));
            res.json(patients);
        }
        catch (error) {
            console.error("Failed to fetch hospital's patients with access:", error);
            res.status(500).json({ error: "Failed to fetch patients" });
        }
    });
    // Get specific patient's records for hospital (with access check)
    app.get("/api/hospital/patient/:patientId/records", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            // Check if hospital has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, hospital.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's records." });
            }
            const records = await storage.getMedicalRecords(patientId);
            res.json(records);
        }
        catch (error) {
            console.error("Failed to fetch patient records:", error);
            res.status(500).json({ error: "Failed to fetch records" });
        }
    });
    // Get specific patient's health profile for hospital (with access check)
    app.get("/api/hospital/patient/:patientId/profile", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital)
                return res.status(404).json({ error: "Hospital not found" });
            // Check if hospital has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, hospital.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's profile." });
            }
            const patient = await storage.getUser(patientId);
            const profile = await storage.getHealthProfile(patientId);
            res.json({
                ...patient,
                healthProfile: profile,
            });
        }
        catch (error) {
            console.error("Failed to fetch patient profile:", error);
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });
    // ============================================
    // EMERGENCY ROUTES
    // ============================================
    // Get emergency scans
    app.get("/api/emergency/scans", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            // Get audit logs for emergency scans
            const logs = await storage.getAuditLogs(responder.id);
            const scans = logs.filter(log => log.action === "qr_scanned");
            res.json(scans);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch scans" });
        }
    });
    // Search for patient (emergency responder)
    app.get("/api/emergency/search", async (req, res) => {
        try {
            const { query } = req.query;
            if (!query || !query.trim()) {
                return res.status(400).json({ error: "Search query is required" });
            }
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            let patient = await storage.getUserByUid(query.trim());
            if (!patient) {
                patient = await storage.getUserByUsername(query.trim());
            }
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "Can only search for patients" });
            }
            const records = await storage.getMedicalRecords(patient.id);
            const hasAccess = await storage.checkAccess(patient.id, responder.id);
            res.json({
                id: patient.id,
                username: patient.username,
                uid: patient.uid,
                status: patient.status,
                recordCount: records.length,
                hasAccess,
            });
        }
        catch (error) {
            console.error("Emergency responder search error:", error);
            res.status(500).json({ error: "Search failed" });
        }
    });
    // Verify and decode emergency QR
    app.post("/api/emergency/verify-qr", async (req, res) => {
        try {
            const { qrData } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            if (!qrData)
                return res.status(400).json({ error: "QR data required" });
            // Parse QR data
            let parsedData;
            try {
                parsedData = JSON.parse(qrData);
            }
            catch (e) {
                return res.status(400).json({ error: "Invalid QR data format" });
            }
            // Verify the patient exists
            const patient = await storage.getUserByUid(parsedData.uid);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            // Increment scan count
            await storage.incrementQRScanCount(patient.id);
            // Create audit log
            await storage.createAuditLog({
                userId: responder.id,
                action: "qr_scanned",
                targetType: "qr",
                targetId: patient.id,
                metadata: { patientUid: patient.uid, timestamp: Date.now() },
            });
            // Return the QR data which contains all emergency information
            res.json({
                success: true,
                data: parsedData,
            });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to verify QR" });
        }
    });
    // Get emergency responder's patients with granted access
    app.get("/api/emergency/patients", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            // Get all access requests for this responder with granted status
            const accessRequests = await storage.getAccessRequestsByRequester(responder.id);
            const grantedAccess = accessRequests.filter(req => req.status === "granted");
            // Enrich with patient data
            const patients = await Promise.all(grantedAccess.map(async (access) => {
                const patient = await storage.getUser(access.patientId);
                const records = await storage.getMedicalRecords(access.patientId);
                return {
                    id: patient?.id,
                    uid: patient?.uid,
                    username: patient?.username,
                    status: patient?.status,
                    profilePicture: patient?.profilePicture,
                    accessGrantedAt: access.respondedAt,
                    accessType: access.accessType,
                    recordCount: records.length,
                    isEmergency: access.isEmergency || false,
                };
            }));
            res.json(patients);
        }
        catch (error) {
            console.error("Failed to fetch emergency responder's patients:", error);
            res.status(500).json({ error: "Failed to fetch patients" });
        }
    });
    // Get specific patient's records for emergency responder (with access check)
    app.get("/api/emergency/patient/:patientId/records", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            // Check if responder has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, responder.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's records." });
            }
            const records = await storage.getMedicalRecords(patientId);
            res.json(records);
        }
        catch (error) {
            console.error("Failed to fetch patient records:", error);
            res.status(500).json({ error: "Failed to fetch records" });
        }
    });
    // Get specific patient's health profile for emergency responder (with access check)
    app.get("/api/emergency/patient/:patientId/profile", async (req, res) => {
        try {
            const { patientId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const responder = await storage.getUserByWalletAddress(walletAddress);
            if (!responder)
                return res.status(404).json({ error: "Responder not found" });
            if (responder.role !== "emergency_responder") {
                return res.status(403).json({ error: "Access denied. Only emergency responders can access this endpoint." });
            }
            // Check if responder has access to this patient's records
            const hasAccess = await storage.checkAccess(patientId, responder.id);
            if (!hasAccess) {
                return res.status(403).json({ error: "Access denied. You don't have permission to view this patient's profile." });
            }
            const patient = await storage.getUser(patientId);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            const healthProfile = await storage.getHealthProfile(patientId);
            res.json({
                username: patient.username,
                uid: patient.uid,
                email: patient.email,
                hospitalName: patient.hospitalName,
                profilePicture: patient.profilePicture,
                ...healthProfile,
            });
        }
        catch (error) {
            console.error("Failed to fetch patient profile:", error);
            res.status(500).json({ error: "Failed to fetch profile" });
        }
    });
    // ============================================
    // INSURANCE ROUTES
    // ============================================
    // Get insurance claims
    app.get("/api/insurance/claims", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            // Get all connections for this provider
            const connections = await storage.getProviderConnections(provider.id);
            const connectionIds = connections.map(c => c.id);
            // Get claims for all connections
            const allClaims = await Promise.all(connectionIds.map(connectionId => storage.getClaims({ connectionId })));
            const claims = allClaims.flat();
            res.json(claims);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch claims" });
        }
    });
    // Get insurance provider profile
    app.get("/api/insurance/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            res.json(provider);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch provider profile" });
        }
    });
    // Update insurance provider profile
    app.put("/api/insurance/profile", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            await storage.updateInsuranceProvider(provider.id, req.body);
            await storage.createAuditLog({
                userId: user.id,
                action: "provider_profile_updated",
                targetType: "insurance_provider",
                targetId: provider.id,
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to update provider profile" });
        }
    });
    // Get all available insurance providers (for patients to browse)
    app.get("/api/patient/insurance/available-providers", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const patient = await storage.getUserByWalletAddress(walletAddress);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            const providers = await storage.getInsuranceProviders();
            // Enrich with user info
            const enrichedProviders = await Promise.all(providers.map(async (provider) => {
                const user = await storage.getUser(provider.userId);
                return {
                    ...provider,
                    username: user?.username,
                    profilePicture: user?.profilePicture,
                };
            }));
            res.json(enrichedProviders);
        }
        catch (error) {
            console.error("Error fetching available providers:", error);
            res.status(500).json({ error: "Failed to fetch available providers" });
        }
    });
    // Submit insurance connection request (patient)
    app.post("/api/patient/insurance/connect", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const patient = await storage.getUserByWalletAddress(walletAddress);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            const connectionSchema = insertPatientInsuranceConnectionSchema.omit({ patientId: true });
            const validatedData = connectionSchema.parse(req.body);
            const connection = await storage.createInsuranceConnectionRequest({
                patientId: patient.id,
                ...validatedData,
            });
            await storage.createAuditLog({
                userId: patient.id,
                action: "insurance_connection_requested",
                targetType: "insurance_connection",
                targetId: connection.id,
            });
            res.status(201).json(connection);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({ error: "Invalid connection data", details: error.errors });
            }
            console.error("Insurance connection error:", error);
            res.status(500).json({ error: "Failed to submit connection request" });
        }
    });
    // Manual payment for monthly insurance fee (patient)
    app.post("/api/patient/insurance/pay/:connectionId", async (req, res) => {
        try {
            const { connectionId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const patient = await storage.getUserByWalletAddress(walletAddress);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            // Get connection details
            const connections = await storage.getPatientInsuranceConnections(patient.id);
            const connection = connections.find((c) => c.id === connectionId);
            if (!connection) {
                return res.status(404).json({ error: "Insurance connection not found" });
            }
            if (connection.status !== "connected") {
                return res.status(400).json({ error: "Insurance connection is not active" });
            }
            // Simulate payment processing (in a real system, this would integrate with a payment gateway)
            // For now, we'll always succeed
            await storage.updateConnectionBilling(connectionId, new Date(), 0 // Reset missed payments count
            );
            await storage.createAuditLog({
                userId: patient.id,
                action: "insurance_payment_made",
                targetType: "insurance_connection",
                targetId: connectionId,
                metadata: {
                    amount: connection.monthlyFee,
                    paymentDate: new Date().toISOString(),
                },
            });
            res.json({
                success: true,
                message: "Payment processed successfully",
                amount: connection.monthlyFee,
                nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
        }
        catch (error) {
            console.error("Payment error:", error);
            res.status(500).json({ error: "Failed to process payment" });
        }
    });
    // Get insurance connection requests (for insurance provider)
    app.get("/api/insurance/connections", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            const connections = await storage.getProviderConnections(provider.id);
            res.json(connections);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch connections" });
        }
    });
    // Approve insurance connection
    app.post("/api/insurance/connections/:id/approve", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address is required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user) {
                console.log("[Approve] Provider user not found for wallet:", walletAddress);
                return res.status(404).json({ error: "Provider not found" });
            }
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider) {
                console.log("[Approve] Insurance provider profile not found for user:", user.id);
                return res.status(404).json({ error: "Insurance provider profile not found" });
            }
            await storage.updateConnectionStatus(id, "connected", user.id);
            await storage.createAuditLog({
                userId: user.id,
                action: "insurance_connection_approved",
                targetType: "insurance_connection",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Connection approval error:", error);
            res.status(500).json({ error: "Failed to approve connection" });
        }
    });
    // Reject insurance connection
    app.post("/api/insurance/connections/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            if (!walletAddress) {
                return res.status(400).json({ error: "Wallet address is required" });
            }
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user) {
                console.log("[Reject] Provider user not found for wallet:", walletAddress);
                return res.status(404).json({ error: "Provider not found" });
            }
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider) {
                console.log("[Reject] Insurance provider profile not found for user:", user.id);
                return res.status(404).json({ error: "Insurance provider profile not found" });
            }
            if (!reason || reason.trim() === "") {
                return res.status(400).json({ error: "Rejection reason is required" });
            }
            await storage.updateConnectionStatus(id, "disconnected", user.id, reason);
            await storage.createAuditLog({
                userId: user.id,
                action: "insurance_connection_rejected",
                targetType: "insurance_connection",
                targetId: id,
                metadata: { reason },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Connection rejection error:", error);
            res.status(500).json({ error: "Failed to reject connection" });
        }
    });
    // Get insurance analytics
    app.get("/api/insurance/analytics", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            const connections = await storage.getProviderConnections(provider.id);
            const connectedPatients = connections.filter(c => c.status === "connected");
            const pendingConnections = connections.filter(c => c.status === "pending");
            // Get claims for all connections
            const connectionIds = connections.map(c => c.id);
            const allClaims = await Promise.all(connectionIds.map(connectionId => storage.getClaims({ connectionId })));
            const claims = allClaims.flat();
            const now = new Date();
            const thisMonth = claims.filter(c => {
                const submittedDate = new Date(c.submittedAt);
                return submittedDate.getMonth() === now.getMonth() &&
                    submittedDate.getFullYear() === now.getFullYear();
            });
            const totalPayout = thisMonth.reduce((sum, c) => {
                return sum + (parseFloat(c.amount) || 0);
            }, 0);
            const statusCounts = {
                pending: claims.filter(c => c.status === "pending").length,
                approved: claims.filter(c => c.status === "approved").length,
                paid: claims.filter(c => c.status === "paid").length,
                rejected: claims.filter(c => c.status === "rejected").length,
            };
            const claimTypeAmounts = {
                emergency: claims.filter(c => c.claimType === "emergency").reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
                outpatient: claims.filter(c => c.claimType === "outpatient").reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
                inpatient: claims.filter(c => c.claimType === "inpatient").reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
                surgery: claims.filter(c => c.claimType === "surgery").reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
            };
            const approvedCount = claims.filter(c => c.status === "approved" || c.status === "paid").length;
            const approvalRate = claims.length > 0 ? Math.round((approvedCount / claims.length) * 100) : 0;
            res.json({
                claimsThisMonth: thisMonth.length,
                totalPayout,
                approvalRate,
                connectedPatients: connectedPatients.length,
                pendingConnections: pendingConnections.length,
                statusCounts,
                claimTypeAmounts,
                totalClaims: claims.length,
                monthlyRevenue: connectedPatients.length * parseFloat(provider.monthlyFee || "0"),
            });
        }
        catch (error) {
            console.error("Analytics error:", error);
            res.status(500).json({ error: "Failed to fetch analytics" });
        }
    });
    // Approve insurance claim (insurance provider)
    app.post("/api/insurance/claims/:id/approve", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            const allClaims = await storage.getClaims({});
            const claim = allClaims.find(c => c.id === id);
            if (!claim) {
                return res.status(404).json({ error: "Claim not found" });
            }
            await storage.updateClaimStatus(id, "approved", {
                respondedAt: new Date()
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "claim_approved_by_insurance",
                targetType: "claim",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Claim approval error:", error);
            res.status(500).json({ error: "Failed to approve claim" });
        }
    });
    // Process payment for approved claim (insurance provider)
    app.post("/api/insurance/claims/:id/pay", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            const allClaims = await storage.getClaims({});
            const claim = allClaims.find(c => c.id === id);
            if (!claim) {
                return res.status(404).json({ error: "Claim not found" });
            }
            if (claim.status !== "approved") {
                return res.status(400).json({ error: "Only approved claims can be paid" });
            }
            await storage.updateClaimStatus(id, "paid", {
                paidAmount: claim.amount,
                paidAt: new Date()
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "claim_paid_by_insurance",
                targetType: "claim",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Claim payment error:", error);
            res.status(500).json({ error: "Failed to process payment" });
        }
    });
    // Reject insurance claim (insurance provider)
    app.post("/api/insurance/claims/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            if (!reason || reason.trim() === "") {
                return res.status(400).json({ error: "Rejection reason is required" });
            }
            await storage.updateClaimStatus(id, "rejected", {
                rejectionReason: reason
            });
            await storage.createAuditLog({
                userId: user.id,
                action: "claim_rejected_by_insurance",
                targetType: "claim",
                targetId: id,
                metadata: { reason },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Claim rejection error:", error);
            res.status(500).json({ error: "Failed to reject claim" });
        }
    });
    // Process monthly billing for all insurance connections
    app.post("/api/insurance/process-monthly-billing", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "Provider not found" });
            const provider = await storage.getInsuranceProviderByUserId(user.id);
            if (!provider)
                return res.status(404).json({ error: "Insurance provider profile not found" });
            const connections = await storage.getProviderConnections(provider.id);
            const connectedPatients = connections.filter(c => c.status === "connected");
            let processed = 0;
            let disconnected = 0;
            const results = [];
            for (const connection of connectedPatients) {
                // Simulate payment processing (in a real system, this would charge the patient)
                const paymentSuccessful = Math.random() > 0.1; // 90% success rate for simulation
                if (paymentSuccessful) {
                    // Payment successful, reset missed payments count
                    await storage.updateConnectionBilling(connection.id, new Date(), 0);
                    results.push({
                        patientId: connection.patientId,
                        status: "success",
                        amount: provider.monthlyFee,
                    });
                    processed++;
                }
                else {
                    // Payment failed, increment missed payments count
                    const newMissedCount = (connection.missedPaymentsCount || 0) + 1;
                    await storage.updateConnectionBilling(connection.id, connection.lastBillingDate || new Date(), newMissedCount);
                    // Auto-disconnect if 3 or more consecutive missed payments
                    if (newMissedCount >= 3) {
                        await storage.disconnectInsurance(connection.id);
                        await storage.createAuditLog({
                            userId: connection.patientId,
                            action: "insurance_auto_disconnected",
                            targetType: "insurance_connection",
                            targetId: connection.id,
                            metadata: {
                                reason: "3 consecutive missed payments",
                                missedPaymentsCount: newMissedCount,
                            },
                        });
                        results.push({
                            patientId: connection.patientId,
                            status: "disconnected",
                            missedPayments: newMissedCount,
                            reason: "3 consecutive missed payments",
                        });
                        disconnected++;
                    }
                    else {
                        results.push({
                            patientId: connection.patientId,
                            status: "payment_failed",
                            missedPayments: newMissedCount,
                        });
                    }
                }
            }
            await storage.createAuditLog({
                userId: user.id,
                action: "monthly_billing_processed",
                targetType: "insurance_provider",
                targetId: provider.id,
                metadata: {
                    processed,
                    disconnected,
                    totalConnections: connectedPatients.length,
                },
            });
            res.json({
                success: true,
                processed,
                disconnected,
                totalConnections: connectedPatients.length,
                results,
            });
        }
        catch (error) {
            console.error("Monthly billing error:", error);
            res.status(500).json({ error: "Failed to process monthly billing" });
        }
    });
    // ============================================
    // ADMIN ROUTES
    // ============================================
    // Get KYC queue
    app.get("/api/admin/kyc-queue", async (req, res) => {
        try {
            const kyc = await storage.getPendingKYC();
            res.json(kyc);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch KYC queue" });
        }
    });
    // Get role applications
    app.get("/api/admin/role-applications", async (req, res) => {
        try {
            const applications = await storage.getPendingKYC();
            res.json(applications);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch applications" });
        }
    });
    // Get all users
    app.get("/api/admin/users", async (req, res) => {
        try {
            const users = await storage.getAllUsers();
            res.json(users);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch users" });
        }
    });
    // Get user details with KYC and health profile
    app.get("/api/admin/users/:userId/details", async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await storage.getUser(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const kycData = await storage.getKYC(userId);
            const healthProfile = await storage.getHealthProfile(userId);
            res.json({
                user,
                kyc: kycData || null,
                healthProfile: healthProfile || null,
            });
        }
        catch (error) {
            console.error("Error fetching user details:", error);
            res.status(500).json({ error: "Failed to fetch user details" });
        }
    });
    // Get user-specific audit logs
    app.get("/api/admin/users/:userId/audit-logs", async (req, res) => {
        try {
            const { userId } = req.params;
            const logs = await storage.getUserAuditLogs(userId);
            res.json(logs);
        }
        catch (error) {
            console.error("Error fetching user audit logs:", error);
            res.status(500).json({ error: "Failed to fetch audit logs" });
        }
    });
    // Approve KYC
    app.post("/api/admin/kyc/:id/approve", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const admin = await storage.getUserByWalletAddress(walletAddress);
            if (!admin || admin.role !== "admin") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            const kycData = await storage.getKYCById(id);
            if (!kycData) {
                return res.status(404).json({ error: "KYC not found" });
            }
            await storage.updateKYCStatus(id, "approved", admin.id);
            await storage.updateUserStatus(kycData.userId, "verified");
            if (kycData.selectedHospital) {
                await storage.updateUserInfo(kycData.userId, {
                    hospitalName: kycData.selectedHospital,
                });
            }
            await storage.createAuditLog({
                userId: admin.id,
                action: "kyc_approved",
                targetType: "kyc",
                targetId: id,
                metadata: { kycUserId: kycData.userId },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("KYC approval error:", error);
            res.status(500).json({ error: "Failed to approve KYC" });
        }
    });
    // Reject KYC
    app.post("/api/admin/kyc/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const admin = await storage.getUserByWalletAddress(walletAddress);
            if (!admin || admin.role !== "admin") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            const kycData = await storage.getKYCById(id);
            if (!kycData) {
                return res.status(404).json({ error: "KYC not found" });
            }
            await storage.updateKYCStatus(id, "rejected", admin.id, reason || "Application denied");
            await storage.createAuditLog({
                userId: admin.id,
                action: "kyc_rejected",
                targetType: "kyc",
                targetId: id,
                metadata: { kycUserId: kycData.userId, reason },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("KYC rejection error:", error);
            res.status(500).json({ error: "Failed to reject KYC" });
        }
    });
    // Update user role
    app.post("/api/admin/users/:userId/role", async (req, res) => {
        try {
            const { userId } = req.params;
            const { role } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const admin = await storage.getUserByWalletAddress(walletAddress);
            if (!admin || admin.role !== "admin") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            const kycData = await storage.getKYC(userId);
            if (kycData?.selectedHospital && (role === "doctor" || role === "patient")) {
                await storage.updateUserInfo(userId, {
                    hospitalName: kycData.selectedHospital,
                });
            }
            else if (kycData?.institutionName && role === "hospital") {
                await storage.updateUserInfo(userId, {
                    hospitalName: kycData.institutionName,
                });
            }
            else if (role === "insurance_provider" && kycData) {
                // Create insurance provider entry when approving insurance_provider role
                const providerData = {
                    userId: userId,
                    providerName: kycData.providerName || kycData.institutionName || "Insurance Provider",
                    description: kycData.providerDescription || null,
                    monthlyFee: kycData.monthlyFee || "0",
                    coverageLimit: kycData.coverageLimit || "0",
                    coverageTypes: kycData.coverageTypes || [],
                    isActive: true,
                };
                // Check if provider entry already exists
                const existingProvider = await storage.getInsuranceProviderByUserId(userId);
                if (!existingProvider) {
                    await storage.createInsuranceProvider(providerData);
                }
            }
            await storage.updateUserRole(userId, role);
            await storage.createAuditLog({
                userId: admin.id,
                action: "role_granted",
                targetType: "user",
                targetId: userId,
                metadata: { newRole: role },
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Role update error:", error);
            res.status(500).json({ error: "Failed to update user role" });
        }
    });
    // ============================================
    // CONSULTATION ROUTES
    // ============================================
    // Get doctors in user's hospital
    app.get("/api/consultation/doctors", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            if (!user.hospitalName) {
                return res.json([]);
            }
            const doctors = await storage.getUsersByHospital(user.hospitalName, "doctor");
            res.json(doctors);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch doctors" });
        }
    });
    // Create consultation request
    app.post("/api/consultation/request", async (req, res) => {
        try {
            const { doctorId, reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const patient = await storage.getUserByWalletAddress(walletAddress);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            if (!patient.hospitalName) {
                return res.status(400).json({ error: "You must be assigned to a hospital to request consultation" });
            }
            const doctor = await storage.getUser(doctorId);
            if (!doctor || doctor.role !== "doctor") {
                return res.status(404).json({ error: "Doctor not found" });
            }
            if (doctor.hospitalName !== patient.hospitalName) {
                return res.status(400).json({ error: "Doctor must be in the same hospital" });
            }
            const consultation = await storage.createConsultationRequest({
                patientId: patient.id,
                doctorId,
                hospitalName: patient.hospitalName,
                reason,
                status: "pending",
            });
            await storage.createAuditLog({
                userId: patient.id,
                action: "consultation_requested",
                targetType: "consultation",
                targetId: consultation.id,
                metadata: { doctorId, reason },
            });
            res.json(consultation);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to create consultation request" });
        }
    });
    // Get consultation requests for patient
    app.get("/api/consultation/patient/requests", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const patient = await storage.getUserByWalletAddress(walletAddress);
            if (!patient)
                return res.status(404).json({ error: "Patient not found" });
            const requests = await storage.getConsultationRequests({ patientId: patient.id });
            const enriched = await Promise.all(requests.map(async (req) => {
                const doctor = await storage.getUser(req.doctorId);
                return {
                    ...req,
                    doctorName: doctor?.username,
                    doctorProfilePicture: doctor?.profilePicture,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch consultation requests" });
        }
    });
    // Get consultation requests for doctor
    app.get("/api/consultation/doctor/requests", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor)
                return res.status(404).json({ error: "Doctor not found" });
            const requests = await storage.getConsultationRequests({ doctorId: doctor.id });
            const enriched = await Promise.all(requests.map(async (req) => {
                const patient = await storage.getUser(req.patientId);
                return {
                    ...req,
                    patientName: patient?.username,
                    patientProfilePicture: patient?.profilePicture,
                    patientUid: patient?.uid,
                };
            }));
            res.json(enriched);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch consultation requests" });
        }
    });
    // Get single consultation by ID
    app.get("/api/consultation/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const consultation = await storage.getConsultationById(id);
            if (!consultation) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            // Verify user is part of this consultation
            if (consultation.patientId !== user.id && consultation.doctorId !== user.id) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            // Enrich with doctor and patient info
            const doctor = await storage.getUser(consultation.doctorId);
            const patient = await storage.getUser(consultation.patientId);
            res.json({
                ...consultation,
                doctorUsername: doctor?.username,
                doctorProfilePicture: doctor?.profilePicture,
                patientUsername: patient?.username,
                patientProfilePicture: patient?.profilePicture,
                patientUid: patient?.uid,
            });
        }
        catch (error) {
            console.error("Error fetching consultation:", error);
            res.status(500).json({ error: "Failed to fetch consultation" });
        }
    });
    // Accept consultation request
    app.post("/api/consultation/:id/accept", async (req, res) => {
        try {
            const { id } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor || doctor.role !== "doctor") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            const consultation = await storage.getConsultationById(id);
            if (!consultation || consultation.doctorId !== doctor.id) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            await storage.updateConsultationStatus(id, "accepted");
            await storage.createAuditLog({
                userId: doctor.id,
                action: "consultation_accepted",
                targetType: "consultation",
                targetId: id,
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to accept consultation" });
        }
    });
    // Reject consultation request
    app.post("/api/consultation/:id/reject", async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const doctor = await storage.getUserByWalletAddress(walletAddress);
            if (!doctor || doctor.role !== "doctor") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            const consultation = await storage.getConsultationById(id);
            if (!consultation || consultation.doctorId !== doctor.id) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            await storage.updateConsultationStatus(id, "rejected", reason);
            await storage.createAuditLog({
                userId: doctor.id,
                action: "consultation_rejected",
                targetType: "consultation",
                targetId: id,
                metadata: { reason },
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: "Failed to reject consultation" });
        }
    });
    // ============================================
    // CHAT ROUTES
    // ============================================
    // Get chat messages for a consultation
    app.get("/api/chat/:consultationId/messages", async (req, res) => {
        try {
            const { consultationId } = req.params;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const consultation = await storage.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            if (consultation.patientId !== user.id && consultation.doctorId !== user.id) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            if (consultation.status !== "accepted") {
                return res.status(403).json({ error: "Consultation must be accepted to view messages" });
            }
            const messages = await storage.getChatMessages(consultationId);
            // Enrich messages with sender info and mark if it's from current user
            const enrichedMessages = messages.map(msg => ({
                ...msg,
                isCurrentUser: msg.senderId === user.id,
            }));
            await storage.markMessagesAsRead(consultationId, user.id);
            res.json(enrichedMessages);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch messages" });
        }
    });
    // Send chat message
    app.post("/api/chat/:consultationId/messages", async (req, res) => {
        try {
            const { consultationId } = req.params;
            const { message } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const user = await storage.getUserByWalletAddress(walletAddress);
            if (!user)
                return res.status(404).json({ error: "User not found" });
            const consultation = await storage.getConsultationById(consultationId);
            if (!consultation) {
                return res.status(404).json({ error: "Consultation not found" });
            }
            if (consultation.patientId !== user.id && consultation.doctorId !== user.id) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            if (consultation.status !== "accepted") {
                return res.status(403).json({ error: "Consultation must be accepted to send messages" });
            }
            const receiverId = user.id === consultation.patientId ? consultation.doctorId : consultation.patientId;
            const chatMessage = await storage.createChatMessage({
                consultationId,
                senderId: user.id,
                receiverId,
                message,
                isRead: false,
            });
            res.json(chatMessage);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to send message" });
        }
    });
    // Get patients in hospital (for hospital role)
    app.get("/api/hospital/all-patients", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            if (!hospital.hospitalName) {
                return res.json([]);
            }
            const patients = await storage.getUsersByHospital(hospital.hospitalName, "patient");
            // Enrich with treatment counts and recent activity
            const enrichedPatients = await Promise.all(patients.map(async (patient) => {
                const treatments = await storage.getTreatmentLogs(patient.id);
                const hospitalTreatments = treatments.filter(t => t.hospitalId === hospital.id);
                const latestTreatment = hospitalTreatments.sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())[0];
                // Get access requests
                const accessRequests = await storage.getAccessRequests(patient.id);
                const hospitalRequests = accessRequests.filter(r => r.requesterId === hospital.id);
                // Get current admission status
                const currentAdmission = await storage.getCurrentAdmission(patient.id, hospital.id);
                // Get KYC data for patient info
                const kycData = await storage.getKYC(patient.id);
                const healthProfile = await storage.getHealthProfile(patient.id);
                return {
                    ...patient,
                    treatmentCount: hospitalTreatments.length,
                    lastTreatment: latestTreatment ? {
                        date: latestTreatment.treatmentDate,
                        diagnosis: latestTreatment.diagnosis,
                    } : null,
                    hasActiveAccess: hospitalRequests.some(r => r.status === "granted"),
                    admissionStatus: currentAdmission ? {
                        id: currentAdmission.id,
                        admissionDate: currentAdmission.admissionDate,
                        roomNumber: currentAdmission.roomNumber,
                        ward: currentAdmission.ward,
                        admissionReason: currentAdmission.admissionReason,
                    } : null,
                    isAdmitted: !!currentAdmission,
                    fullName: kycData?.fullName,
                    phoneNumber: kycData?.phoneNumber,
                    bloodType: healthProfile?.bloodType,
                };
            }));
            res.json(enrichedPatients);
        }
        catch (error) {
            console.error("Failed to fetch hospital patients:", error);
            res.status(500).json({ error: "Failed to fetch patients" });
        }
    });
    // Get doctors in hospital (for hospital role)
    app.get("/api/hospital/all-doctors", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            if (!hospital.hospitalName) {
                return res.json([]);
            }
            const doctors = await storage.getUsersByHospital(hospital.hospitalName, "doctor");
            // Enrich with treatment counts and specializations
            const enrichedDoctors = await Promise.all(doctors.map(async (doctor) => {
                const allTreatments = await storage.getTreatmentLogs();
                const doctorTreatments = allTreatments.filter(t => t.doctorId === doctor.id && t.hospitalId === hospital.id);
                const latestTreatment = doctorTreatments.sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())[0];
                // Get unique patient count
                const uniquePatients = new Set(doctorTreatments.map(t => t.patientId));
                // Get KYC for specialization
                const kycData = await storage.getKYC(doctor.id);
                return {
                    ...doctor,
                    treatmentCount: doctorTreatments.length,
                    patientCount: uniquePatients.size,
                    specialization: kycData?.professionalLicense || "General Practice",
                    lastActivity: latestTreatment?.treatmentDate || doctor.createdAt,
                };
            }));
            res.json(enrichedDoctors);
        }
        catch (error) {
            console.error("Failed to fetch hospital doctors:", error);
            res.status(500).json({ error: "Failed to fetch doctors" });
        }
    });
    // Get emergency responders in hospital (for hospital role)
    app.get("/api/hospital/all-emergency-responders", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            if (!hospital.hospitalName) {
                return res.json([]);
            }
            const responders = await storage.getUsersByHospital(hospital.hospitalName, "emergency_responder");
            // Enrich with KYC data
            const enrichedResponders = await Promise.all(responders.map(async (responder) => {
                const kycData = await storage.getKYC(responder.id);
                return {
                    ...responder,
                    professionalLicense: kycData?.professionalLicense || "N/A",
                    joinedAt: responder.createdAt,
                    status: responder.status,
                };
            }));
            res.json(enrichedResponders);
        }
        catch (error) {
            console.error("Failed to fetch emergency responders:", error);
            res.status(500).json({ error: "Failed to fetch emergency responders" });
        }
    });
    // Admit patient to hospital
    app.post("/api/hospital/admit-patient", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            // Validate wallet address
            if (!walletAddress) {
                return res.status(401).json({ error: "Unauthorized - No wallet address provided" });
            }
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            // Authorization check: Only hospital role can admit patients
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Forbidden - Only hospitals can admit patients" });
            }
            // Validate request body with Zod
            const validationResult = admitPatientSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    error: "Invalid request data",
                    details: validationResult.error.errors
                });
            }
            const { patientId, doctorId, admissionReason, roomNumber, ward } = validationResult.data;
            // Verify patient exists and belongs to hospital
            const patient = await storage.getUser(patientId);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            if (patient.role !== "patient") {
                return res.status(400).json({ error: "User is not a patient" });
            }
            // Verify doctor exists if doctorId is provided
            if (doctorId) {
                const doctor = await storage.getUser(doctorId);
                if (!doctor || doctor.role !== "doctor") {
                    return res.status(400).json({ error: "Invalid doctor ID" });
                }
            }
            // Check if patient is already admitted to prevent duplicate active admissions
            const existingAdmission = await storage.getCurrentAdmission(patientId, hospital.id);
            if (existingAdmission) {
                return res.status(400).json({ error: "Patient is already admitted to this hospital" });
            }
            const admission = await storage.createPatientAdmission({
                patientId,
                hospitalId: hospital.id,
                doctorId,
                admittedById: hospital.id,
                admissionReason,
                roomNumber,
                ward,
                status: "admitted",
            });
            // Create audit log
            await storage.createAuditLog({
                userId: hospital.id,
                action: "patient_admitted",
                targetId: patientId,
                targetType: "patient",
                metadata: { admissionId: admission.id, roomNumber, ward },
            });
            res.json(admission);
        }
        catch (error) {
            console.error("Failed to admit patient:", error);
            res.status(500).json({ error: "Failed to admit patient" });
        }
    });
    // Discharge patient from hospital
    app.post("/api/hospital/discharge-patient", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            // Validate wallet address
            if (!walletAddress) {
                return res.status(401).json({ error: "Unauthorized - No wallet address provided" });
            }
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            // Authorization check: Only hospital role can discharge patients
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Forbidden - Only hospitals can discharge patients" });
            }
            // Validate request body with Zod
            const validationResult = dischargePatientSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    error: "Invalid request data",
                    details: validationResult.error.errors
                });
            }
            const { admissionId, dischargeNotes } = validationResult.data;
            // Get the admission to verify it exists, belongs to this hospital, and is currently admitted
            const admissions = await storage.getPatientAdmissions({ hospitalId: hospital.id });
            const admission = admissions.find(a => a.id === admissionId);
            if (!admission) {
                return res.status(404).json({ error: "Admission not found for this hospital" });
            }
            // Verify the admission is currently in "admitted" status (not already discharged)
            if (admission.status !== "admitted") {
                return res.status(400).json({ error: "Patient is not currently admitted (already discharged)" });
            }
            await storage.dischargePatient(admissionId, hospital.id, dischargeNotes);
            // Create audit log
            await storage.createAuditLog({
                userId: hospital.id,
                action: "patient_discharged",
                targetId: admission.patientId,
                targetType: "patient",
                metadata: { admissionId, dischargeNotes },
            });
            res.json({ success: true, message: "Patient discharged successfully" });
        }
        catch (error) {
            console.error("Failed to discharge patient:", error);
            res.status(500).json({ error: "Failed to discharge patient" });
        }
    });
    // Get hospital activity logs
    app.get("/api/hospital/activity-logs", async (req, res) => {
        try {
            const walletAddress = req.headers["x-wallet-address"];
            const hospital = await storage.getUserByWalletAddress(walletAddress);
            if (!hospital || hospital.role !== "hospital") {
                return res.status(403).json({ error: "Unauthorized" });
            }
            // Get all treatments performed at this hospital
            const allTreatments = await storage.getTreatmentLogs();
            const hospitalTreatments = allTreatments.filter(t => t.hospitalId === hospital.id);
            // Get all hospital audit logs
            const auditLogs = await storage.getAuditLogs(hospital.id);
            // Get recent activities (last 50)
            const activities = [
                ...hospitalTreatments.map(t => ({
                    id: t.id,
                    type: "treatment",
                    timestamp: t.treatmentDate,
                    description: `Treatment recorded for patient`,
                    patientId: t.patientId,
                    doctorId: t.doctorId,
                    details: {
                        diagnosis: t.diagnosis,
                        treatment: t.treatment,
                    },
                })),
                ...auditLogs
                    .filter(log => ["access_requested", "access_granted", "claim_submitted", "qr_scanned"].includes(log.action))
                    .map(log => ({
                    id: log.id,
                    type: "activity",
                    timestamp: log.timestamp,
                    action: log.action,
                    targetType: log.targetType,
                    targetId: log.targetId,
                    metadata: log.metadata,
                })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 50);
            res.json({
                totalTreatments: hospitalTreatments.length,
                recentActivities: activities,
            });
        }
        catch (error) {
            console.error("Failed to fetch hospital activity logs:", error);
            res.status(500).json({ error: "Failed to fetch activity logs" });
        }
    });
    // Scan emergency QR code (for doctors and emergency responders)
    app.post("/api/qr/scan", async (req, res) => {
        try {
            const { qrData } = req.body;
            const walletAddress = req.headers["x-wallet-address"];
            const scanner = await storage.getUserByWalletAddress(walletAddress);
            if (!scanner) {
                return res.status(404).json({ error: "User not found" });
            }
            if (scanner.role !== "doctor" && scanner.role !== "emergency_responder" && scanner.role !== "hospital") {
                return res.status(403).json({ error: "Only doctors, emergency responders, and hospitals can scan QR codes" });
            }
            if (!qrData) {
                return res.status(400).json({ error: "QR data is required" });
            }
            let patientInfo;
            try {
                patientInfo = JSON.parse(qrData);
            }
            catch (error) {
                return res.status(400).json({ error: "Invalid QR code format" });
            }
            // Verify the patient exists
            const patient = await storage.getUserByWalletAddress(patientInfo.walletAddress);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            // Log the scan in audit logs
            await storage.createAuditLog({
                userId: scanner.id,
                action: "qr_scanned",
                targetType: "user",
                targetId: patient.id,
                metadata: {
                    scannerRole: scanner.role,
                    patientUid: patient.uid,
                    scanTimestamp: new Date().toISOString(),
                },
            });
            // Return the patient emergency information
            res.json({
                success: true,
                patientInfo: {
                    uid: patientInfo.uid,
                    username: patientInfo.username,
                    profilePicture: patientInfo.profilePicture,
                    hospitalName: patientInfo.hospitalName,
                    emergencyDetails: patientInfo.emergencyDetails,
                    timestamp: patientInfo.timestamp,
                },
            });
        }
        catch (error) {
            console.error("QR scan error:", error);
            res.status(500).json({ error: "Failed to scan QR code" });
        }
    });
    const httpServer = createServer(app);
    return httpServer;
}
