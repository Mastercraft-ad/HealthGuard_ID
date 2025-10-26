import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletButton } from "@/components/WalletButton";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";

import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientProfile from "@/pages/patient/PatientProfile";
import PatientRecords from "@/pages/patient/PatientRecords";
import PatientQR from "@/pages/patient/PatientQR";
import PatientAccess from "@/pages/patient/PatientAccess";
import PatientInsurance from "@/pages/patient/PatientInsurance";
import PatientAudit from "@/pages/patient/PatientAudit";
import PatientApplyRole from "@/pages/patient/PatientApplyRole";
import PatientConsultations from "@/pages/patient/PatientConsultations";
import PatientConsultationChat from "@/pages/patient/PatientConsultationChat";

import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorSearch from "@/pages/doctor/DoctorSearch";
import DoctorScan from "@/pages/doctor/DoctorScan";
import DoctorRequests from "@/pages/doctor/DoctorRequests";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorTreatments from "@/pages/doctor/DoctorTreatments";
import DoctorProfile from "@/pages/doctor/DoctorProfile";
import DoctorConsultations from "@/pages/doctor/DoctorConsultations";
import DoctorConsultationChat from "@/pages/doctor/DoctorConsultationChat";

import HospitalDashboard from "@/pages/hospital/HospitalDashboard";
import HospitalPatients from "@/pages/hospital/HospitalPatients";
import HospitalPatientsWithAccess from "@/pages/hospital/HospitalPatientsWithAccess";
import HospitalManagement from "@/pages/hospital/HospitalManagement";
import HospitalScan from "@/pages/hospital/HospitalScan";
import HospitalAccessRequests from "@/pages/hospital/HospitalAccessRequests";
import HospitalInvoices from "@/pages/hospital/HospitalInvoices";
import HospitalClaims from "@/pages/hospital/HospitalClaims";
import HospitalTreatments from "@/pages/hospital/HospitalTreatments";
import HospitalSettings from "@/pages/hospital/HospitalSettings";

import EmergencyDashboard from "@/pages/emergency/EmergencyDashboard";
import EmergencyScan from "@/pages/emergency/EmergencyScan";
import EmergencyHistory from "@/pages/emergency/EmergencyHistory";
import EmergencyProfile from "@/pages/emergency/EmergencyProfile";
import EmergencyPatients from "@/pages/emergency/EmergencyPatients";

import InsuranceDashboard from "@/pages/insurance/InsuranceDashboard";
import InsuranceClaims from "@/pages/insurance/InsuranceClaims";
import InsurancePayments from "@/pages/insurance/InsurancePayments";
import InsurancePolicies from "@/pages/insurance/InsurancePolicies";
import InsuranceAnalytics from "@/pages/insurance/InsuranceAnalytics";
import InsuranceSettings from "@/pages/insurance/InsuranceSettings";
import InsuranceConnections from "@/pages/insurance/InsuranceConnections";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminKYC from "@/pages/admin/AdminKYC";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminAudit from "@/pages/admin/AdminAudit";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return <Landing />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <WalletButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/patient">
        <AuthenticatedLayout>
          <PatientDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/profile">
        <AuthenticatedLayout>
          <PatientProfile />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/records">
        <AuthenticatedLayout>
          <PatientRecords />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/qr">
        <AuthenticatedLayout>
          <PatientQR />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/access">
        <AuthenticatedLayout>
          <PatientAccess />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/insurance">
        <AuthenticatedLayout>
          <PatientInsurance />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/audit">
        <AuthenticatedLayout>
          <PatientAudit />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/apply-role">
        <AuthenticatedLayout>
          <PatientApplyRole />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/consultations">
        <AuthenticatedLayout>
          <PatientConsultations />
        </AuthenticatedLayout>
      </Route>
      <Route path="/patient/consultations/:id/chat">
        <AuthenticatedLayout>
          <PatientConsultationChat />
        </AuthenticatedLayout>
      </Route>

      <Route path="/doctor">
        <AuthenticatedLayout>
          <DoctorDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/search">
        <AuthenticatedLayout>
          <DoctorSearch />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/scan">
        <AuthenticatedLayout>
          <DoctorScan />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/requests">
        <AuthenticatedLayout>
          <DoctorRequests />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/patients">
        <AuthenticatedLayout>
          <DoctorPatients />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/treatments">
        <AuthenticatedLayout>
          <DoctorTreatments />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/profile">
        <AuthenticatedLayout>
          <DoctorProfile />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/consultations">
        <AuthenticatedLayout>
          <DoctorConsultations />
        </AuthenticatedLayout>
      </Route>
      <Route path="/doctor/consultations/:id/chat">
        <AuthenticatedLayout>
          <DoctorConsultationChat />
        </AuthenticatedLayout>
      </Route>

      <Route path="/hospital">
        <AuthenticatedLayout>
          <HospitalDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/patients">
        <AuthenticatedLayout>
          <HospitalPatients />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/patients-with-access">
        <AuthenticatedLayout>
          <HospitalPatientsWithAccess />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/management">
        <AuthenticatedLayout>
          <HospitalManagement />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/scan">
        <AuthenticatedLayout>
          <HospitalScan />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/access-requests">
        <AuthenticatedLayout>
          <HospitalAccessRequests />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/invoices">
        <AuthenticatedLayout>
          <HospitalInvoices />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/claims">
        <AuthenticatedLayout>
          <HospitalClaims />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/treatments">
        <AuthenticatedLayout>
          <HospitalTreatments />
        </AuthenticatedLayout>
      </Route>
      <Route path="/hospital/settings">
        <AuthenticatedLayout>
          <HospitalSettings />
        </AuthenticatedLayout>
      </Route>

      <Route path="/emergency">
        <AuthenticatedLayout>
          <EmergencyDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/emergency/scan">
        <AuthenticatedLayout>
          <EmergencyScan />
        </AuthenticatedLayout>
      </Route>
      <Route path="/emergency/history">
        <AuthenticatedLayout>
          <EmergencyHistory />
        </AuthenticatedLayout>
      </Route>
      <Route path="/emergency/profile">
        <AuthenticatedLayout>
          <EmergencyProfile />
        </AuthenticatedLayout>
      </Route>
      <Route path="/emergency/patients">
        <AuthenticatedLayout>
          <EmergencyPatients />
        </AuthenticatedLayout>
      </Route>

      <Route path="/insurance">
        <AuthenticatedLayout>
          <InsuranceDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/claims">
        <AuthenticatedLayout>
          <InsuranceClaims />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/payments">
        <AuthenticatedLayout>
          <InsurancePayments />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/policies">
        <AuthenticatedLayout>
          <InsurancePolicies />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/analytics">
        <AuthenticatedLayout>
          <InsuranceAnalytics />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/connections">
        <AuthenticatedLayout>
          <InsuranceConnections />
        </AuthenticatedLayout>
      </Route>
      <Route path="/insurance/settings">
        <AuthenticatedLayout>
          <InsuranceSettings />
        </AuthenticatedLayout>
      </Route>

      <Route path="/admin">
        <AuthenticatedLayout>
          <AdminDashboard />
        </AuthenticatedLayout>
      </Route>
      <Route path="/admin/kyc">
        <AuthenticatedLayout>
          <AdminKYC />
        </AuthenticatedLayout>
      </Route>
      <Route path="/admin/roles">
        <AuthenticatedLayout>
          <AdminRoles />
        </AuthenticatedLayout>
      </Route>
      <Route path="/admin/audit">
        <AuthenticatedLayout>
          <AdminAudit />
        </AuthenticatedLayout>
      </Route>
      <Route path="/admin/users">
        <AuthenticatedLayout>
          <AdminUsers />
        </AuthenticatedLayout>
      </Route>
      <Route path="/admin/settings">
        <AuthenticatedLayout>
          <AdminSettings />
        </AuthenticatedLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WalletProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
