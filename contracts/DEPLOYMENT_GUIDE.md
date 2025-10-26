# HealthGuardX Smart Contract Deployment Guide

## Overview

The HealthGuardX smart contract is a comprehensive Solidity contract that integrates all features of the HealthGuardX decentralized health identity system, including wallet connection, medical records, insurance payments, hospital claims, and subscription management.

## Contract Features

### 1. User Management & Authentication
- Wallet-based registration with unique health IDs (UIDs)
- Role-based access control (Patient, Doctor, Hospital, Emergency, Insurance, Admin)
- KYC verification workflow with document submission and approval
- Role application and approval system

### 2. Medical Records Management
- Encrypted medical record storage with IPFS CIDs
- Granular access control with expiration dates
- Emergency access for first responders
- Treatment logging with file attachments
- Read/Write permission management

### 3. Insurance System
- **Policy Creation**: Insurance providers create policies for patients
- **Premium Payments**: Patients pay monthly premiums in BDAG
- **Claims Workflow**: 
  - Hospitals submit claims with invoice documentation
  - Insurance providers review and approve/reject claims
  - Approved claims are paid out to hospitals
- **Coverage Management**: Track coverage amounts and policy status

### 4. Hospital Operations
- **Annual Subscriptions**: 10,000 BDAG per year
- **Invoice Management**: Create and track patient invoices
- **Consultation Scheduling**: Schedule and complete patient consultations
- **Treatment Records**: Log treatments with diagnosis and prescriptions
- **Claim Submissions**: Submit insurance claims for patient treatments

### 5. Insurance Provider Operations
- **Annual Subscriptions**: 15,000 BDAG per year
- **Policy Management**: Create and manage patient policies
- **Claims Processing**: Review, approve, and pay claims
- **Premium Collection**: Receive premium payments from patients

### 6. Payment Flows

All payments use BDAG (BlockDAG native token) with a 2% platform fee:

```
Patient → Insurance (Premium Payments)
Insurance → Hospital (Claim Payments - 2% fee)
Patient → Hospital (Invoice Payments - 2% fee)
Patient → Doctor (Consultation Fees - 2% fee)
Hospital → Platform (Annual Subscription: 10,000 BDAG)
Insurance → Platform (Annual Subscription: 15,000 BDAG)
```

### 7. Audit & Compliance
- Comprehensive event logging for all transactions
- Immutable blockchain records
- Access history tracking
- Emergency access logging

## Deployment Steps

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### 1. Setup Hardhat

Create `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    blockdag: {
      url: process.env.BLOCKDAG_RPC_URL || "https://rpc.blockdag.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1 // Update with actual BlockDAG chain ID
    }
  }
};

export default config;
```

### 2. Deploy Script

Create `scripts/deploy.ts`:
```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying HealthGuardX with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  
  const HealthGuardX = await ethers.getContractFactory("HealthGuardX");
  const healthGuardX = await HealthGuardX.deploy(treasuryAddress);
  
  await healthGuardX.deployed();
  
  console.log("HealthGuardX deployed to:", healthGuardX.address);
  console.log("Platform Treasury:", treasuryAddress);
  
  console.log("\nContract Constants:");
  console.log("Hospital Subscription:", await healthGuardX.HOSPITAL_ANNUAL_SUBSCRIPTION());
  console.log("Insurance Subscription:", await healthGuardX.INSURANCE_ANNUAL_SUBSCRIPTION());
  console.log("Platform Fee:", await healthGuardX.PLATFORM_FEE_PERCENTAGE(), "%");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Deploy to BlockDAG

```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network blockdag
```

### 4. Verify Contract (Optional)

```bash
npx hardhat verify --network blockdag DEPLOYED_CONTRACT_ADDRESS TREASURY_ADDRESS
```

## Integration with Existing Backend

### Update Environment Variables

Add to `.env`:
```env
HEALTHGUARDX_CONTRACT_ADDRESS=0x...
BLOCKDAG_RPC_URL=https://rpc.blockdag.network
PRIVATE_KEY=your_private_key_here
TREASURY_ADDRESS=platform_treasury_wallet
```

### Backend Integration Example

Create `server/blockchain/contract.ts`:
```typescript
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.HEALTHGUARDX_CONTRACT_ADDRESS!;
const RPC_URL = process.env.BLOCKDAG_RPC_URL!;

const ABI = [...]; // Import from compiled artifacts

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

export async function registerUserOnChain(uid: string, username: string, walletAddress: string) {
  const signer = await getSigner(walletAddress);
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.registerUser(uid, username);
  await tx.wait();
  return tx.hash;
}

export async function submitKYCOnChain(
  walletAddress: string,
  documentCID: string,
  documentType: string,
  documentHash: string
) {
  const signer = await getSigner(walletAddress);
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.submitKYC(documentCID, documentType, documentHash);
  await tx.wait();
  return tx.hash;
}

export async function payPremiumOnChain(
  walletAddress: string,
  policyId: string,
  amount: bigint
) {
  const signer = await getSigner(walletAddress);
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.payPremium(policyId, { value: amount });
  await tx.wait();
  return tx.hash;
}

export async function submitClaimOnChain(
  hospitalWallet: string,
  claimId: string,
  policyId: string,
  amount: bigint,
  invoiceCID: string,
  invoiceHash: string,
  diagnosis: string
) {
  const signer = await getSigner(hospitalWallet);
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.submitClaim(
    claimId,
    policyId,
    amount,
    invoiceCID,
    invoiceHash,
    diagnosis
  );
  await tx.wait();
  return tx.hash;
}

async function getSigner(walletAddress: string): Promise<ethers.Signer> {
  // Implement based on your wallet connection strategy
  // This is a placeholder
  return new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
}
```

## Event Listening for Database Sync

Create `server/blockchain/eventListener.ts`:
```typescript
import { ethers } from "ethers";
import { storage } from "../storage";

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

export function startEventListeners() {
  contract.on("UserRegistered", async (user, uid, role, timestamp, event) => {
    console.log("User registered on-chain:", uid);
    // Sync with PostgreSQL database
    await storage.updateUserBlockchainData(uid, {
      onChainRegistered: true,
      registrationTxHash: event.transactionHash
    });
  });
  
  contract.on("PremiumPaid", async (policyId, patient, amount, timestamp, event) => {
    console.log("Premium paid on-chain:", policyId);
    await storage.recordPremiumPayment({
      policyId,
      patientWallet: patient,
      amount: amount.toString(),
      txHash: event.transactionHash,
      paidAt: new Date(timestamp.toNumber() * 1000)
    });
  });
  
  contract.on("ClaimSubmitted", async (claimId, patient, hospital, amount, event) => {
    console.log("Claim submitted on-chain:", claimId);
    await storage.updateClaimStatus(claimId, {
      status: "pending",
      blockchainTxHash: event.transactionHash
    });
  });
  
  contract.on("ClaimPaid", async (claimId, hospital, amount, timestamp, event) => {
    console.log("Claim paid on-chain:", claimId);
    await storage.updateClaimStatus(claimId, {
      status: "paid",
      paidAmount: amount.toString(),
      paidAt: new Date(timestamp.toNumber() * 1000),
      paymentTxHash: event.transactionHash
    });
  });
}
```

## Security Considerations

1. **Access Control**: All sensitive functions require proper role verification
2. **Payment Safety**: Uses checks-effects-interactions pattern to prevent reentrancy
3. **Balance Management**: Separate balance tracking for each entity
4. **Platform Fees**: Automatic 2% fee collection on all transactions
5. **Subscription Enforcement**: Hospitals and insurance providers must maintain active subscriptions
6. **Emergency Access**: Emergency responders have read-only access without explicit grants

## Gas Optimization

- Packed structs for storage efficiency
- External functions for reduced gas costs
- Minimal on-chain storage (uses IPFS CIDs)
- Events for off-chain indexing instead of on-chain arrays

## Testing

Create comprehensive tests in `test/HealthGuardX.test.ts`:
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("HealthGuardX", function () {
  // Test user registration
  // Test KYC workflow
  // Test medical record management
  // Test insurance policy creation
  // Test premium payments
  // Test claim submission and payment
  // Test subscriptions
  // Test access control
});
```

Run tests:
```bash
npx hardhat test
```

## Production Checklist

- [ ] Deploy to BlockDAG mainnet
- [ ] Verify contract on block explorer
- [ ] Set up event listeners for database sync
- [ ] Configure platform treasury wallet
- [ ] Test all payment flows with real BDAG
- [ ] Monitor contract for security issues
- [ ] Set up automated subscription renewal reminders
- [ ] Implement admin dashboard for contract monitoring
- [ ] Create backup/recovery procedures
- [ ] Document API integration points

## Support

For issues or questions, refer to:
- BlockDAG Documentation: https://blockdag.network/docs
- Contract Source: `/contracts/HealthGuardX.sol`
- HealthGuardX Docs: `/replit.md`
