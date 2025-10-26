import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, BLOCKCHAIN_CONFIG } from "./blockchain-config";
import { readFileSync } from "fs";
import { join } from "path";
// Load ABIs
const usersABI = JSON.parse(readFileSync(join(process.cwd(), "abis", "HealthGuardXUsers.json"), "utf-8"));
const medicalABI = JSON.parse(readFileSync(join(process.cwd(), "abis", "HealthGuardXMedical.json"), "utf-8"));
const treatmentsABI = JSON.parse(readFileSync(join(process.cwd(), "abis", "HealthGuardXTreatments.json"), "utf-8"));
const insuranceABI = JSON.parse(readFileSync(join(process.cwd(), "abis", "HealthGuardXInsurance.json"), "utf-8"));
const paymentsABI = JSON.parse(readFileSync(join(process.cwd(), "abis", "HealthGuardXPayments.json"), "utf-8"));
class BlockchainService {
    constructor() {
        // Initialize provider
        this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
        // Initialize contracts with provider (read-only)
        this.usersContract = new ethers.Contract(CONTRACT_ADDRESSES.users, usersABI, this.provider);
        this.medicalContract = new ethers.Contract(CONTRACT_ADDRESSES.medical, medicalABI, this.provider);
        this.treatmentsContract = new ethers.Contract(CONTRACT_ADDRESSES.treatments, treatmentsABI, this.provider);
        this.insuranceContract = new ethers.Contract(CONTRACT_ADDRESSES.insurance, insuranceABI, this.provider);
        this.paymentsContract = new ethers.Contract(CONTRACT_ADDRESSES.payments, paymentsABI, this.provider);
    }
    // User Management Functions
    async registerUser(walletAddress, uid, username) {
        try {
            // For transactions, we need a signer
            // Note: This will need to be called from the frontend with the user's wallet
            console.log(`[Blockchain] User registration prepared for ${walletAddress}: ${uid}`);
            return `user_registration_${uid}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing user registration:', error);
            throw error;
        }
    }
    async getUserByAddress(walletAddress) {
        try {
            const user = await this.usersContract.users(walletAddress);
            return {
                walletAddress: user.walletAddress,
                uid: user.uid,
                username: user.username,
                role: user.role,
                isRegistered: user.isRegistered,
                kycVerified: user.kycVerified,
                registeredAt: user.registeredAt,
            };
        }
        catch (error) {
            console.error('[Blockchain] Error fetching user:', error);
            return null;
        }
    }
    // KYC Functions
    async submitKYC(walletAddress, documentCID) {
        try {
            console.log(`[Blockchain] KYC submission prepared for ${walletAddress}: ${documentCID}`);
            return `kyc_${documentCID}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing KYC submission:', error);
            throw error;
        }
    }
    async verifyKYC(walletAddress, adminAddress) {
        try {
            console.log(`[Blockchain] KYC verification prepared for ${walletAddress} by ${adminAddress}`);
            return `kyc_verified_${walletAddress}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing KYC verification:', error);
            throw error;
        }
    }
    // Medical Records Functions
    async addMedicalRecord(patientAddress, recordId, recordCID, recordHash, recordType) {
        try {
            console.log(`[Blockchain] Medical record prepared for ${patientAddress}: ${recordId}`);
            return `record_${recordId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing medical record:', error);
            throw error;
        }
    }
    async grantAccess(patientAddress, requesterAddress, expiresAt) {
        try {
            console.log(`[Blockchain] Access grant prepared from ${patientAddress} to ${requesterAddress}`);
            return `access_grant_${Date.now()}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing access grant:', error);
            throw error;
        }
    }
    async revokeAccess(patientAddress, requesterAddress) {
        try {
            console.log(`[Blockchain] Access revocation prepared from ${patientAddress} for ${requesterAddress}`);
            return `access_revoke_${Date.now()}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing access revocation:', error);
            throw error;
        }
    }
    async checkAccess(patientAddress, requesterAddress) {
        try {
            const accessGrant = await this.medicalContract.accessGrants(patientAddress, requesterAddress);
            return accessGrant.isActive && accessGrant.expiresAt > Math.floor(Date.now() / 1000);
        }
        catch (error) {
            console.error('[Blockchain] Error checking access:', error);
            return false;
        }
    }
    // Treatment Functions
    async addTreatment(patientAddress, doctorAddress, treatmentId, treatmentCID, diagnosis, prescription) {
        try {
            console.log(`[Blockchain] Treatment prepared for ${patientAddress} by ${doctorAddress}: ${treatmentId}`);
            return `treatment_${treatmentId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing treatment:', error);
            throw error;
        }
    }
    // Insurance Functions
    async createPolicy(patientAddress, policyId, coverageAmount, monthlyPremium) {
        try {
            console.log(`[Blockchain] Insurance policy prepared for ${patientAddress}: ${policyId}`);
            return `policy_${policyId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing insurance policy:', error);
            throw error;
        }
    }
    async payPremium(patientAddress, policyId, amount) {
        try {
            console.log(`[Blockchain] Premium payment prepared for ${policyId}: ${amount.toString()}`);
            return `premium_${policyId}_${Date.now()}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing premium payment:', error);
            throw error;
        }
    }
    async submitClaim(hospitalAddress, claimId, policyId, amount, treatmentCID) {
        try {
            console.log(`[Blockchain] Insurance claim prepared: ${claimId}`);
            return `claim_${claimId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing claim submission:', error);
            throw error;
        }
    }
    async approveClaim(insuranceAddress, claimId) {
        try {
            console.log(`[Blockchain] Claim approval prepared for: ${claimId}`);
            return `claim_approved_${claimId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing claim approval:', error);
            throw error;
        }
    }
    async payClaim(insuranceAddress, claimId, amount) {
        try {
            console.log(`[Blockchain] Claim payment prepared for: ${claimId}`);
            return `claim_paid_${claimId}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing claim payment:', error);
            throw error;
        }
    }
    // Payment Functions
    async processPayment(fromAddress, toAddress, amount, paymentType, referenceId) {
        try {
            console.log(`[Blockchain] Payment prepared: ${paymentType} - ${referenceId}`);
            return `payment_${referenceId}_${Date.now()}`;
        }
        catch (error) {
            console.error('[Blockchain] Error preparing payment:', error);
            throw error;
        }
    }
    // Utility Functions
    async getTransactionReceipt(txHash) {
        try {
            return await this.provider.getTransactionReceipt(txHash);
        }
        catch (error) {
            console.error('[Blockchain] Error fetching transaction receipt:', error);
            return null;
        }
    }
    async waitForTransaction(txHash, confirmations = 1) {
        try {
            return await this.provider.waitForTransaction(txHash, confirmations);
        }
        catch (error) {
            console.error('[Blockchain] Error waiting for transaction:', error);
            return null;
        }
    }
    // Helper function to generate transaction hash for logging
    generateTxHash() {
        return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    }
    // Check if blockchain is available
    async isAvailable() {
        try {
            await this.provider.getBlockNumber();
            return true;
        }
        catch (error) {
            console.warn('[Blockchain] Blockchain network not available:', error);
            return false;
        }
    }
}
export const blockchainService = new BlockchainService();
export { BlockchainService };
