import { ethers } from "ethers";
// Network configuration
export const BLOCKDAG_NETWORK = {
    chainId: 1043,
    chainIdHex: "0x413",
    chainName: "BlockDAG Awakening",
    nativeCurrency: {
        name: "BDAG",
        symbol: "BDAG",
        decimals: 18
    },
    rpcUrls: ["https://rpc.awakening.bdagscan.com"],
    blockExplorerUrls: ["https://awakening.bdagscan.com"]
};
// Contract addresses
export const CONTRACT_ADDRESSES = {
    users: "0x7ddd2eb4ece89825096367fd6f72623996ad1a55",
    medical: "0x33b7b70a1a20233b441527a7cd5b43c791d78860",
    treatments: "0x865f4b7835cffad383d33211033ea3b747010cd8",
    insurance: "0xeaa1afa47136f28828464a69e21046da8706c635",
    payments: "0x479a9cd7bee5a12333ae3f44ad7b960aaf479278ffcb733cf3f4f80d00f465ae",
};
// Import ABIs (these will be imported as needed)
import usersABI from "@/../../abis/HealthGuardXUsers.json";
import medicalABI from "@/../../abis/HealthGuardXMedical.json";
import treatmentsABI from "@/../../abis/HealthGuardXTreatments.json";
import insuranceABI from "@/../../abis/HealthGuardXInsurance.json";
import paymentsABI from "@/../../abis/HealthGuardXPayments.json";
export class BlockchainClient {
    constructor() {
        this.provider = null;
        this.signer = null;
    }
    async checkAndSwitchNetwork() {
        if (!window.ethereum) {
            throw new Error("MetaMask not installed");
        }
        try {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log("Current network:", { chainId: currentChainId, name: currentChainId === BLOCKDAG_NETWORK.chainIdHex ? BLOCKDAG_NETWORK.chainName : "unknown" });
            if (currentChainId !== BLOCKDAG_NETWORK.chainIdHex) {
                console.log(`Switching to ${BLOCKDAG_NETWORK.chainName}...`);
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: BLOCKDAG_NETWORK.chainIdHex }],
                    });
                }
                catch (switchError) {
                    if (switchError.code === 4902) {
                        console.log("Network not found, adding it...");
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                    chainId: BLOCKDAG_NETWORK.chainIdHex,
                                    chainName: BLOCKDAG_NETWORK.chainName,
                                    nativeCurrency: BLOCKDAG_NETWORK.nativeCurrency,
                                    rpcUrls: BLOCKDAG_NETWORK.rpcUrls,
                                    blockExplorerUrls: BLOCKDAG_NETWORK.blockExplorerUrls,
                                }],
                        });
                    }
                    else {
                        throw switchError;
                    }
                }
            }
        }
        catch (error) {
            console.error("Error checking/switching network:", error);
            throw error;
        }
    }
    async connect() {
        if (!window.ethereum) {
            throw new Error("MetaMask not installed");
        }
        await this.checkAndSwitchNetwork();
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        const address = await this.signer.getAddress();
        const balance = await this.provider.getBalance(address);
        console.log(`Wallet: ${address}, Balance: ${ethers.formatEther(balance)} BDAG`);
        return this.signer;
    }
    async getContract(contractName) {
        if (!this.signer) {
            await this.connect();
        }
        const abis = {
            users: usersABI,
            medical: medicalABI,
            treatments: treatmentsABI,
            insurance: insuranceABI,
            payments: paymentsABI,
        };
        return new ethers.Contract(CONTRACT_ADDRESSES[contractName], abis[contractName], this.signer);
    }
    // User functions
    async registerUser(uid, username) {
        const contract = await this.getContract("users");
        const tx = await contract.registerUser(uid, username);
        return await tx.wait();
    }
    async submitKYC(documentCID) {
        const contract = await this.getContract("users");
        const tx = await contract.submitKYC(documentCID);
        return await tx.wait();
    }
    // Medical record functions
    async addMedicalRecord(recordId, recordCID, recordHash, recordType) {
        const contract = await this.getContract("medical");
        const tx = await contract.addRecord(recordId, recordCID, recordHash, recordType);
        return await tx.wait();
    }
    async grantAccess(requesterAddress, expiresAt) {
        const contract = await this.getContract("medical");
        const tx = await contract.grantAccess(requesterAddress, expiresAt);
        return await tx.wait();
    }
    async revokeAccess(requesterAddress) {
        const contract = await this.getContract("medical");
        const tx = await contract.revokeAccess(requesterAddress);
        return await tx.wait();
    }
    // Treatment functions
    async addTreatment(patientAddress, treatmentId, treatmentCID, diagnosis, prescription) {
        const contract = await this.getContract("treatments");
        const tx = await contract.addTreatment(patientAddress, treatmentId, treatmentCID, diagnosis, prescription);
        return await tx.wait();
    }
    // Insurance functions
    async payPremium(policyId, amount) {
        const contract = await this.getContract("insurance");
        const tx = await contract.payPremium(policyId, {
            value: ethers.parseEther(amount),
        });
        return await tx.wait();
    }
    async submitClaim(claimId, policyId, amount, treatmentCID) {
        const contract = await this.getContract("insurance");
        const tx = await contract.submitClaim(claimId, policyId, ethers.parseEther(amount), treatmentCID);
        return await tx.wait();
    }
    // Payment functions
    async processPayment(toAddress, amount, paymentType, referenceId) {
        const contract = await this.getContract("payments");
        const tx = await contract.processPayment(toAddress, paymentType, referenceId, {
            value: ethers.parseEther(amount),
        });
        return await tx.wait();
    }
    // Utility functions
    async getTransactionReceipt(txHash) {
        if (!this.provider) {
            await this.connect();
        }
        return await this.provider.getTransactionReceipt(txHash);
    }
}
export const blockchainClient = new BlockchainClient();
