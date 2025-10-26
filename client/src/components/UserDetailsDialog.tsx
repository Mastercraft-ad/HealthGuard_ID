import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  Wallet, 
  Calendar,
  Shield,
  Phone,
  Mail,
  MapPin,
  Activity,
  Heart,
  Users,
  FileText,
  Clock
} from "lucide-react";

interface UserDetailsDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserDetailsDialog({ userId, open, onOpenChange }: UserDetailsDialogProps) {
  const { data: userDetails, refetch } = useQuery<any>({
    queryKey: ["/api/admin/users", userId, "details"],
    enabled: !!userId && open,
  });

  const { data: auditLogs } = useQuery<any[]>({
    queryKey: ["/api/admin/users", userId, "audit-logs"],
    enabled: !!userId && open,
  });

  useEffect(() => {
    if (userId && open) {
      refetch();
    }
  }, [userId, open, refetch]);

  if (!userDetails) return null;

  const { user, kyc, healthProfile } = userDetails;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined | null }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <p className="text-sm font-medium" data-testid={`text-user-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-500",
      doctor: "bg-blue-500/10 text-blue-500",
      hospital: "bg-green-500/10 text-green-500",
      insurance_provider: "bg-orange-500/10 text-orange-500",
      emergency_responder: "bg-red-500/10 text-red-500",
      patient: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={colors[role] || ""}>{role.replace("_", " ")}</Badge>;
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: { variant: "default", label: "Verified" },
      pending: { variant: "secondary", label: "Pending" },
      suspended: { variant: "destructive", label: "Suspended" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" data-testid="dialog-user-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Complete user information including KYC, health profile, and activity logs
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
                    <AvatarFallback>
                      <User className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg" data-testid="text-user-username">{user.username}</h3>
                    <div className="flex items-center gap-2">
                      {roleBadge(user.role)}
                      {statusBadge(user.status)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={Shield} label="UID" value={user.uid} />
                  <InfoRow icon={Wallet} label="Wallet Address" value={user.walletAddress} />
                  <InfoRow icon={Calendar} label="Registered" value={new Date(user.createdAt).toLocaleDateString()} />
                  {user.email && <InfoRow icon={Mail} label="Email" value={user.email} />}
                  {user.hospitalName && <InfoRow icon={Users} label="Hospital Name" value={user.hospitalName} />}
                </div>
              </CardContent>
            </Card>

            {kyc && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    KYC Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={User} label="Full Name" value={kyc.fullName} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={kyc.dateOfBirth} />
                    <InfoRow icon={FileText} label="National ID" value={kyc.nationalId} />
                    <InfoRow icon={Phone} label="Phone Number" value={kyc.phoneNumber} />
                    <InfoRow icon={MapPin} label="Address" value={kyc.address} />
                    <InfoRow icon={FileText} label="Document Type" value={kyc.documentType} />
                    {kyc.professionalLicense && (
                      <InfoRow icon={Shield} label="Professional License" value={kyc.professionalLicense} />
                    )}
                    {kyc.institutionName && (
                      <InfoRow icon={Users} label="Institution Name" value={kyc.institutionName} />
                    )}
                    {kyc.requestedRole && (
                      <div className="flex items-start gap-3 py-2">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Requested Role</Label>
                          <Badge variant="outline">{kyc.requestedRole.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-3 py-2">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">KYC Status</Label>
                      <Badge 
                        variant={kyc.status === "approved" ? "default" : kyc.status === "rejected" ? "destructive" : "secondary"}
                      >
                        {kyc.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {healthProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Emergency Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={User} label="Emergency Contact Name" value={healthProfile.emergencyContactName} />
                    <InfoRow icon={Phone} label="Emergency Contact Phone" value={healthProfile.emergencyContactPhone} />
                    <InfoRow icon={Users} label="Relationship" value={healthProfile.emergencyContactRelation} />
                    <InfoRow icon={Heart} label="Blood Type" value={healthProfile.bloodType} />
                    {healthProfile.allergies && healthProfile.allergies.length > 0 && (
                      <div className="flex items-start gap-3 py-2 col-span-2">
                        <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Allergies</Label>
                          <p className="text-sm font-medium">{healthProfile.allergies.join(", ")}</p>
                        </div>
                      </div>
                    )}
                    {healthProfile.chronicConditions && healthProfile.chronicConditions.length > 0 && (
                      <div className="flex items-start gap-3 py-2 col-span-2">
                        <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">Chronic Conditions</Label>
                          <p className="text-sm font-medium">{healthProfile.chronicConditions.join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {auditLogs && auditLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Activity ({auditLogs.length} events)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {auditLogs.slice(0, 20).map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 border-l-2 border-muted pl-3 py-2" data-testid={`log-${log.id}`}>
                          <Activity className="h-3 w-3 text-muted-foreground mt-1" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.action.replace(/_/g, ' ')}
                              </Badge>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {log.targetType && (
                              <p className="text-xs text-muted-foreground">
                                Target: {log.targetType}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
