import 'dotenv/config';
import { db } from '../server/db';
import { users, kyc, subscriptionPayments } from '../shared/schema';
import { sql } from 'drizzle-orm';
import CryptoJS from 'crypto-js';

// Test wallet addresses
const TEST_WALLETS = {
  doctor: '0x1234567890123456789012345678901234567890',
  hospital: '0x2345678901234567890123456789012345678901',
  insurance: '0x3456789012345678901234567890123456789012',
  emergency: '0x4567890123456789012345678901234567890123'
};

async function clearTestData() {
  console.log('Cleaning up test data...');
  for (const address of Object.values(TEST_WALLETS)) {
    const user = await db.select().from(users).where(sql`wallet_address = ${address.toLowerCase()}`);
    if (user[0]) {
      await db.delete(kyc).where(sql`user_id = ${user[0].id}`);
      await db.delete(subscriptionPayments).where(sql`user_id = ${user[0].id}`);
      await db.delete(users).where(sql`id = ${user[0].id}`);
    }
  }
}

async function testDoctorRole() {
  console.log('\nTesting Doctor Role Application...');
  const doctorData = {
    walletAddress: TEST_WALLETS.doctor,
    role: 'doctor',
    fullName: 'Dr. John Smith',
    professionalLicense: 'MD123456',
    selectedHospital: 'General Hospital',
    documentType: 'national_id',
    documentNumber: 'DOC123456',
    documentCID: 'QmTestDoctorCID'
  };
  
  try {
    // Create user first
    const [user] = await db.insert(users).values({
      walletAddress: doctorData.walletAddress.toLowerCase(),
      uid: 'HID' + Date.now(),
      username: 'dr_smith',
      role: 'patient',
      status: 'pending'
    }).returning();
    
    // Submit KYC
    const [kycEntry] = await db.insert(kyc).values({
      userId: user.id,
      fullName: doctorData.fullName,
      professionalLicense: doctorData.professionalLicense,
      affiliatedHospital: doctorData.selectedHospital,
      documentType: doctorData.documentType,
      documentNumber: doctorData.documentNumber,
      documentCID: doctorData.documentCID,
      requestedRole: 'doctor',
      status: 'pending'
    }).returning();
    
    console.log('Doctor role application submitted successfully:', {
      userId: user.id,
      kycId: kycEntry.id,
      status: kycEntry.status
    });
  } catch (error) {
    console.error('Error in doctor role test:', error);
  }
}

async function testHospitalRole() {
  console.log('\nTesting Hospital Role Application...');
  const hospitalData = {
    walletAddress: TEST_WALLETS.hospital,
    role: 'hospital',
    institutionName: 'City General Hospital',
    country: 'United States',
    state: 'California',
    location: '123 Healthcare Ave, Los Angeles, CA 90001',
    hospitalProfile: 'Leading healthcare facility with advanced medical services',
    documentType: 'business_license',
    documentNumber: 'HSP123456',
    documentCID: 'QmTestHospitalCID'
  };
  
  try {
    // Create user first
    const [user] = await db.insert(users).values({
      walletAddress: hospitalData.walletAddress.toLowerCase(),
      uid: 'HID' + Date.now(),
      username: 'city_general',
      role: 'patient',
      status: 'pending'
    }).returning();
    
    // Create subscription payment
    const [payment] = await db.insert(subscriptionPayments).values({
      userId: user.id,
      role: 'hospital',
      amount: '2',
      transactionHash: '0x' + CryptoJS.SHA256(Date.now().toString()).toString().slice(0, 64),
      fromAddress: hospitalData.walletAddress.toLowerCase(),
      toAddress: '0x3c17f3F514658fACa2D24DE1d29F542a836FD10A',
      status: 'confirmed',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }).returning();
    
    // Submit KYC
    const [kycEntry] = await db.insert(kyc).values({
      userId: user.id,
      institutionName: hospitalData.institutionName,
      country: hospitalData.country,
      state: hospitalData.state,
      location: hospitalData.location,
      hospitalProfile: hospitalData.hospitalProfile,
      documentType: hospitalData.documentType,
      documentNumber: hospitalData.documentNumber,
      documentCID: hospitalData.documentCID,
      requestedRole: 'hospital',
      status: 'pending'
    }).returning();
    
    console.log('Hospital role application submitted successfully:', {
      userId: user.id,
      kycId: kycEntry.id,
      paymentId: payment.id,
      status: kycEntry.status
    });
  } catch (error) {
    console.error('Error in hospital role test:', error);
  }
}

async function testInsuranceProviderRole() {
  console.log('\nTesting Insurance Provider Role Application...');
  const insuranceData = {
    walletAddress: TEST_WALLETS.insurance,
    role: 'insurance_provider',
    providerName: 'HealthCare Plus',
    providerDescription: 'Comprehensive health insurance coverage',
    monthlyFee: '50.00',
    coverageLimit: '1000000.00',
    coverageTypes: ['emergency', 'outpatient', 'inpatient', 'surgery'],
    documentType: 'business_license',
    documentNumber: 'INS123456',
    documentCID: 'QmTestInsuranceCID'
  };
  
  try {
    // Create user first
    const [user] = await db.insert(users).values({
      walletAddress: insuranceData.walletAddress.toLowerCase(),
      uid: 'HID' + Date.now(),
      username: 'healthcare_plus',
      role: 'patient',
      status: 'pending'
    }).returning();
    
    // Create subscription payment
    const [payment] = await db.insert(subscriptionPayments).values({
      userId: user.id,
      role: 'insurance_provider',
      amount: '2',
      transactionHash: '0x' + CryptoJS.SHA256(Date.now().toString()).toString().slice(0, 64),
      fromAddress: insuranceData.walletAddress.toLowerCase(),
      toAddress: '0x3c17f3F514658fACa2D24DE1d29F542a836FD10A',
      status: 'confirmed',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }).returning();
    
    // Submit KYC
    const [kycEntry] = await db.insert(kyc).values({
      userId: user.id,
      providerName: insuranceData.providerName,
      providerDescription: insuranceData.providerDescription,
      monthlyFee: insuranceData.monthlyFee,
      coverageLimit: insuranceData.coverageLimit,
      coverageTypes: insuranceData.coverageTypes,
      documentType: insuranceData.documentType,
      documentNumber: insuranceData.documentNumber,
      documentCID: insuranceData.documentCID,
      requestedRole: 'insurance_provider',
      status: 'pending'
    }).returning();
    
    console.log('Insurance provider role application submitted successfully:', {
      userId: user.id,
      kycId: kycEntry.id,
      paymentId: payment.id,
      status: kycEntry.status
    });
  } catch (error) {
    console.error('Error in insurance provider role test:', error);
  }
}

async function testEmergencyResponderRole() {
  console.log('\nTesting Emergency Responder Role Application...');
  const emergencyData = {
    walletAddress: TEST_WALLETS.emergency,
    role: 'emergency_responder',
    fullName: 'Jane Wilson',
    professionalLicense: 'EMT123456',
    selectedHospital: 'City General Hospital',
    documentType: 'certification',
    documentNumber: 'EMT123456',
    documentCID: 'QmTestEmergencyCID'
  };
  
  try {
    // Create user first
    const [user] = await db.insert(users).values({
      walletAddress: emergencyData.walletAddress.toLowerCase(),
      uid: 'HID' + Date.now(),
      username: 'emt_wilson',
      role: 'patient',
      status: 'pending'
    }).returning();
    
    // Submit KYC
    const [kycEntry] = await db.insert(kyc).values({
      userId: user.id,
      fullName: emergencyData.fullName,
      professionalLicense: emergencyData.professionalLicense,
      affiliatedHospital: emergencyData.selectedHospital,
      documentType: emergencyData.documentType,
      documentNumber: emergencyData.documentNumber,
      documentCID: emergencyData.documentCID,
      requestedRole: 'emergency_responder',
      status: 'pending'
    }).returning();
    
    console.log('Emergency responder role application submitted successfully:', {
      userId: user.id,
      kycId: kycEntry.id,
      status: kycEntry.status
    });
  } catch (error) {
    console.error('Error in emergency responder role test:', error);
  }
}

async function verifyRoleApplications() {
  console.log('\nVerifying role applications...');
  const kycEntries = await db.select().from(kyc).where(sql`status = 'pending'`);
  
  for (const entry of kycEntries) {
    try {
      // Update KYC status to approved
      await db.update(kyc)
        .set({ 
          status: 'approved',
          reviewedAt: new Date(),
          reviewedBy: 'SYSTEM'
        })
        .where(sql`id = ${entry.id}`);
      
      // Update user role and status
      await db.update(users)
        .set({ 
          role: entry.requestedRole,
          status: 'verified'
        })
        .where(sql`id = ${entry.userId}`);
      
      console.log(`Approved role application for KYC ID: ${entry.id}`);
    } catch (error) {
      console.error(`Error verifying KYC ID ${entry.id}:`, error);
    }
  }
}

async function testAllRoles() {
  try {
    console.log('Starting role application tests...');
    
    // Clean up any existing test data
    await clearTestData();
    
    // Test each role
    await testDoctorRole();
    await testHospitalRole();
    await testInsuranceProviderRole();
    await testEmergencyResponderRole();
    
    // Verify all applications
    await verifyRoleApplications();
    
    console.log('\nAll role tests completed successfully!');
  } catch (error) {
    console.error('Error in test execution:', error);
  } finally {
    process.exit();
  }
}

// Run all tests
testAllRoles();