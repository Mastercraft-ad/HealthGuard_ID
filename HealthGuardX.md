# HealthGuardX - Decentralized Health Identity System

## Overview

HealthGuardX is a blockchain-integrated system designed to provide secure, patient-owned medical records and streamline insurance claim management. It features emergency QR access, role-based dashboards for various healthcare stakeholders (patients, doctors, hospitals, emergency responders, insurance providers, administrators), and blockchain-verified insurance claims. The project operates on the BlockDAG ecosystem with BDAG as the primary currency. The project aims to enhance data security, improve accessibility for authorized personnel, and provide a robust platform for managing health identities and claims.

## Recent Changes (October 26, 2025)

### MetaMask Signature-Based Payment System (Latest)

- **MetaMask Confirmation Without Blockchain Transactions**: Replaced actual blockchain transactions with signature-based payment authorization:
  - Users must confirm payments via MetaMask signature (similar to QR code generation flow)
  - MetaMask popup displays payment details (role, amount, wallet address, timestamp) for user verification
  - No actual blockchain transaction is sent - only a cryptographic signature is collected
  - Mock transaction hashes are generated from the signature for tracking purposes
  - All payment flows still update the database correctly and maintain complete audit trails
  - No BDAG tokens required and no gas fees incurred
  - Users can reject payment in MetaMask if they don't want to proceed
  - This provides the security and verification benefits of MetaMask without blockchain network dependencies

### BlockDAG Awakening Network Configuration

- **Updated Blockchain Network Configuration**: Connected to BlockDAG Awakening testnet:
  - RPC URL: `https://rpc.awakening.bdagscan.com`
  - Chain ID: 1043 (0x413 in hex)
  - Network Name: "BlockDAG Awakening"
  - Block Explorer: `https://awakening.bdagscan.com`
  - Native Currency: BDAG (18 decimals)
  
- **Automatic Network Switching**: Enhanced frontend blockchain client with smart network management:
  - Automatically detects current network and switches to BlockDAG Awakening if needed
  - Adds BlockDAG Awakening network to MetaMask if not already present
  - Displays wallet address and BDAG balance in console on connection
  - Improved error handling for network-related issues
  - Updated in `client/src/lib/blockchain.ts` and `server/blockchain-config.ts`

- **Transaction Error Prevention**: Fixed common transaction errors:
  - Network mismatch detection and automatic correction
  - Proper RPC endpoint configuration
  - Chain ID validation before all transactions
  - Better error messages for debugging transaction issues

## Recent Changes (October 25, 2025)

### Blockchain & IPFS Integration

- **Real Smart Contract Integration**: Connected to deployed BlockDAG smart contracts:
  - HealthGuardXUsers: `0x7ddd2eb4ece89825096367fd6f72623996ad1a55`
  - HealthGuardXMedical: `0x33b7b70a1a20233b441527a7cd5b43c791d78860`
  - HealthGuardXTreatments: `0x865f4b7835cffad383d33211033ea3b747010cd8`
  - HealthGuardXInsurance: `0xeaa1afa47136f28828464a69e21046da8706c635`
  - HealthGuardXPayments: `0x479a9cd7bee5a12333ae3f44ad7b960aaf479278ffcb733cf3f4f80d00f465ae`

- **Pinata IPFS Storage**: Replaced simulated IPFS with real Pinata cloud storage:
  - All medical records now uploaded to IPFS with real CIDs
  - KYC documents stored on IPFS for immutable verification
  - Treatment logs and patient data permanently stored on decentralized storage
  - File integrity verified with SHA-256 hashes
  - Automatic fallback to simulated storage if IPFS is unavailable

- **Blockchain Service Layer**: Created comprehensive blockchain integration infrastructure:
  - `server/blockchain.ts`: Smart contract read-only service for querying blockchain state
  - `server/blockchain-config.ts`: Contract addresses and network configuration  
  - `client/src/lib/blockchain.ts`: **Frontend blockchain client for user transactions** (this is where actual contract interactions happen)
  - Following Web3 best practices: Users sign transactions with their MetaMask wallets on the frontend
  - Server only reads blockchain state and validates results - never stores private keys
  - Supports user registration, KYC submission, medical records, treatments, insurance, and payments via frontend wallet signing

- **IPFS Service Module**: Built complete Pinata integration:
  - `server/ipfs.ts`: Handles file and JSON uploads to Pinata
  - Supports both file upload (with base64 encoding) and JSON data upload
  - Returns CID, hash, and gateway URL for each upload
  - Metadata support for organizing uploaded content

- **Updated Routes for Real Storage**: Modified all backend routes to use actual IPFS:
  - KYC document submission uploads to IPFS
  - Medical record uploads store files on IPFS with permanent CIDs
  - Treatment logs uploaded as JSON to IPFS for immutable audit trail
  - All uploads include metadata for tracking and organization

## Recent Changes (October 25, 2025 - Earlier)

- **Reduced Testing Payment Amount**: Updated subscription payment for hospital and insurance provider KYC:
  - Reduced annual subscription fee from 20 BDAG to 2 BDAG for easier testing
  - Updated across frontend (PatientApplyRole.tsx) and backend (routes.ts)
  - All payment messages and validation updated to reflect 2 BDAG amount
  - Transaction logic preserved and working correctly with MetaMask integration

- **Patient KYC Submission Fix**: Fixed issue where patient KYC submissions weren't showing the latest data:
  - Updated `getKYC` function in storage.ts to order by `submittedAt DESC`
  - Ensures the most recent KYC submission is always returned to the user
  - Allows patients to resubmit KYC if rejected without data conflicts
  - Maintains full submission history in the database

- **App Logo and Favicon**: Added professional branding to the application:
  - Created custom SVG favicon featuring medical shield with cross design
  - Added blue gradient styling consistent with HealthGuardX branding
  - Properly configured in HTML head with SVG MIME type
  - Visible in browser tabs and bookmarks

- **Admin Dashboard Real-Time Updates**: Completed real-time AJAX polling for all Admin dashboard pages:
  - Added React Query `refetchInterval` (3 seconds) to AdminDashboard, AdminKYC, AdminRoles, AdminUsers, and AdminAudit
  - Admin panel now shows live updates for KYC queue, role applications, user management, and audit logs
  - No manual page refresh needed - data updates automatically every 3 seconds
  - Consistent with existing real-time patterns across patient, doctor, hospital, insurance, and emergency modules

- **MetaMask Mobile Wallet Integration**: Upgraded wallet connection system for mobile device support:
  - Integrated `@metamask/sdk` for seamless mobile wallet connectivity
  - Desktop users continue using MetaMask browser extension (existing behavior)
  - Mobile users automatically get MetaMask mobile app deep linking
  - Mobile device detection determines appropriate connection method
  - Deep links open MetaMask mobile app for secure wallet connection and transaction signing
  - Works across iOS and Android mobile browsers
  - Maintains backward compatibility with existing desktop wallet flows

- **Real-time AJAX Updates**: Implemented automatic page refresh across all modules without manual reload:
  - Added React Query `refetchInterval` polling (3-5 seconds) to all data-fetching pages
  - Covers doctor, hospital, insurance, patient, and emergency modules
  - Access requests, claims, consultations, and patient records now update automatically
  - Provides real-time experience similar to chat functionality

- **Payment Transaction Verification**: Verified insurance and hospital payment flows:
  - Insurance claim payments properly update database and create audit logs
  - Hospital invoices and claims tracked with consistent database updates
  - Patient insurance premium payments working with billing connection updates
  - All payment transactions validate wallet addresses and log actions

- **Content Security Policy Fix**: Updated CSP to allow blob URLs for patient record viewer:
  - Added `frame-src 'self' blob:` directive to allow PDF/document viewing in iframes
  - Added `worker-src 'self' blob:` directive to allow image compression workers
  - Fixed "Refused to frame blob:" and "Refused to create a worker" CSP errors
  - Medical document viewing now fully functional without security policy blocks

- **Rebranding**: Renamed from "HealthID Nexus" to "HealthGuardX" throughout the application
- **Currency Update**: Replaced all dollar symbols ($) with BDAG to reflect BlockDAG ecosystem integration  
- **Treatment File Upload**: Added secure file upload functionality to doctor's treatment form with comprehensive server-side validation:
  - Maximum 5 files per treatment
  - File size limit: 10MB per file
  - Allowed MIME types: PDF, JPG, PNG, DOC, DOCX
  - Filename length validation (max 255 characters)
  - Data URL format validation
  - Files stored as base64 in treatmentFiles JSONB field

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite for development and Wouter for routing.
- **UI/UX**: Shadcn/ui (built on Radix UI) for components, Tailwind CSS for styling, and Material Design principles. Features a custom color palette, Inter font, and responsive design with light/dark modes.
- **State Management**: TanStack Query (React Query) for server state management.

### Backend Architecture
- **Framework**: Express.js with TypeScript, following a RESTful API design.
- **Authentication**: Web3 wallet-based authentication (MetaMask via ethers.js) with wallet signature verification.
- **Authorization**: Role-Based Access Control (RBAC) across six distinct roles, with session management tied to wallet addresses.
- **Data Access**: Centralized storage abstraction interface using Drizzle ORM for type-safe PostgreSQL queries and transaction support.

### Data Storage
- **Database**: PostgreSQL (Neon serverless PostgreSQL in cloud) with connection pooling.
- **Schema Design**: Includes tables for users (wallet-based), KYC verification, health profiles, encrypted medical records with real IPFS CIDs, granular access control, treatment logs, insurance policies, claims processing, and audit logs.
- **Security**: Client-side encryption (CryptoJS) for sensitive data, real IPFS (Pinata) for immutability, SHA-256 hashing, and encrypted emergency QR data.
- **Decentralized Storage**: Pinata IPFS integration for permanent, immutable file storage with content-addressed retrieval.

### Key Architectural Decisions
- **Wallet-Based Authentication**: Utilizes Web3 wallet signatures for strong, decentralized identity verification, eliminating password vulnerabilities.
- **Role-Based Dashboard System**: Provides distinct interfaces and data access for patients, doctors, hospitals, emergency personnel, insurance providers, and administrators, enforcing the principle of least privilege.
- **Real Blockchain Integration**: Connected to deployed BlockDAG smart contracts for on-chain verification of users, medical records, treatments, insurance policies, and payments. Contract ABIs located in `/abis` directory.
- **IPFS Decentralized Storage**: Uses Pinata IPFS service for permanent, immutable storage of medical documents, KYC files, and treatment records with content-addressed retrieval.
- **Emergency QR Access**: Implements QR codes with encrypted critical medical information for instant, offline access by first responders.
- **Granular Access Control**: Manages fine-grained permissions (read/write/emergency) with expiration dates for medical records, aligning with privacy requirements.
- **Centralized Storage Abstraction**: Offers a single, type-safe interface for all database operations, improving maintainability and consistency.

## External Dependencies

- **Blockchain & Web3**: `ethers.js` (v6) for wallet connectivity and message signing, `@metamask/sdk` for mobile wallet integration, MetaMask as the primary wallet provider supporting both browser extension (desktop) and mobile app (via deep linking).
- **Database & ORM**: `@neondatabase/serverless` for PostgreSQL connection, Drizzle ORM, `drizzle-kit` for schema management, `connect-pg-simple` for session storage.
- **UI Component Libraries**: `@radix-ui/*` primitives, `react-day-picker`, `cmdk`, QR code generation libraries.
- **Utilities**: `crypto-js` for encryption, `date-fns` for date manipulation, `nanoid` for unique IDs, `class-variance-authority`, `clsx`, `tailwind-merge` for CSS.
- **Development Tools**: `tsx`, `esbuild`, `cross-env`.
