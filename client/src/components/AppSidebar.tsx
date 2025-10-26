import { useLocation } from "wouter";
import { useWallet } from "@/contexts/WalletContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  Upload,
  Shield,
  FileText,
  Heart,
  Users,
  Stethoscope,
  Building2,
  Ambulance,
  Building,
  UserCog,
  QrCode,
  Activity,
  FileCheck,
  Settings,
  ClipboardList,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { role, uid } = useWallet();

  const patientNav = [
    { title: "Dashboard", icon: Home, url: "/patient" },
    { title: "Profile", icon: User, url: "/patient/profile" },
    { title: "Health Records", icon: FileText, url: "/patient/records" },
    { title: "Consultations", icon: MessageSquare, url: "/patient/consultations" },
    { title: "Emergency QR", icon: QrCode, url: "/patient/qr" },
    { title: "Access Control", icon: Shield, url: "/patient/access" },
    { title: "Insurance", icon: Heart, url: "/patient/insurance" },
    { title: "Audit Log", icon: Activity, url: "/patient/audit" },
    { title: "Apply for Role", icon: UserCog, url: "/patient/apply-role" },
  ];

  const doctorNav = [
    { title: "Dashboard", icon: Home, url: "/doctor" },
    { title: "Consultations", icon: MessageSquare, url: "/doctor/consultations" },
    { title: "Patient Search", icon: Users, url: "/doctor/search" },
    { title: "My Patients", icon: Users, url: "/doctor/patients" },
    { title: "Scan QR Code", icon: QrCode, url: "/doctor/scan" },
    { title: "Access Requests", icon: Shield, url: "/doctor/requests" },
    { title: "Treatment Logs", icon: FileCheck, url: "/doctor/treatments" },
    { title: "My Profile", icon: User, url: "/doctor/profile" },
  ];

  const hospitalNav = [
    { title: "Dashboard", icon: Home, url: "/hospital" },
    { title: "Management", icon: Users, url: "/hospital/management" },
    { title: "Patients", icon: Users, url: "/hospital/patients" },
    { title: "Patients with Access", icon: Shield, url: "/hospital/patients-with-access" },
    { title: "Scan Patient", icon: QrCode, url: "/hospital/scan" },
    { title: "Access Requests", icon: Shield, url: "/hospital/access-requests" },
    { title: "Invoices", icon: FileText, url: "/hospital/invoices" },
    { title: "Claims", icon: ClipboardList, url: "/hospital/claims" },
    { title: "Settings", icon: Settings, url: "/hospital/settings" },
  ];

  const emergencyNav = [
    { title: "Dashboard", icon: Home, url: "/emergency" },
    { title: "Scan QR Code", icon: QrCode, url: "/emergency/scan" },
    { title: "Accessible Patients", icon: Users, url: "/emergency/patients" },
    { title: "Recent Scans", icon: Activity, url: "/emergency/history" },
    { title: "My Profile", icon: User, url: "/emergency/profile" },
  ];

  const insuranceNav = [
    { title: "Dashboard", icon: Home, url: "/insurance" },
    { title: "Patient Requests", icon: Users, url: "/insurance/connections" },
    { title: "Pending Claims", icon: ClipboardList, url: "/insurance/claims" },
    { title: "Payments", icon: DollarSign, url: "/insurance/payments" },
    { title: "Policies", icon: FileText, url: "/insurance/policies" },
    { title: "Analytics", icon: Activity, url: "/insurance/analytics" },
    { title: "Settings", icon: Settings, url: "/insurance/settings" },
  ];

  const adminNav = [
    { title: "Dashboard", icon: Home, url: "/admin" },
    { title: "KYC Queue", icon: FileCheck, url: "/admin/kyc" },
    { title: "Role Management", icon: UserCog, url: "/admin/roles" },
    { title: "Audit Logs", icon: Activity, url: "/admin/audit" },
    { title: "Users", icon: Users, url: "/admin/users" },
    { title: "Settings", icon: Settings, url: "/admin/settings" },
  ];

  const getNavItems = () => {
    switch (role) {
      case "doctor":
        return { items: doctorNav, icon: Stethoscope, label: "Doctor Portal" };
      case "hospital":
        return { items: hospitalNav, icon: Building2, label: "Hospital Portal" };
      case "emergency_responder":
        return { items: emergencyNav, icon: Ambulance, label: "Emergency Portal" };
      case "insurance_provider":
        return { items: insuranceNav, icon: Building, label: "Insurance Portal" };
      case "admin":
        return { items: adminNav, icon: UserCog, label: "Admin Portal" };
      default:
        return { items: patientNav, icon: User, label: "Patient Portal" };
    }
  };

  const { items, icon: RoleIcon, label } = getNavItems();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">HealthGuardX</span>
            {uid && (
              <span className="text-xs text-muted-foreground font-mono" data-testid="text-sidebar-uid">
                {uid.slice(0, 12)}...
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <RoleIcon className="h-4 w-4" />
            {label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => setLocation(item.url)}
                      isActive={isActive}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-xs text-muted-foreground">Connected</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {role || "patient"}
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
