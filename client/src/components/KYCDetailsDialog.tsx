import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  User, 
  FileText, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  CreditCard,
  Shield,
  Hospital,
  Briefcase
} from "lucide-react";

interface KYCDetailsDialogProps {
  kyc: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KYCDetailsDialog({ kyc, open, onOpenChange }: KYCDetailsDialogProps) {
  if (!kyc) return null;

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined | null }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <p className="text-sm font-medium" data-testid={`text-kyc-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-kyc-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Application Details
          </DialogTitle>
          <DialogDescription>
            Complete Know Your Customer verification information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow icon={User} label="Full Name" value={kyc.fullName} />
              <InfoRow icon={Calendar} label="Date of Birth" value={kyc.dateOfBirth} />
              <InfoRow icon={CreditCard} label="National ID" value={kyc.nationalId} />
              <InfoRow icon={Phone} label="Phone Number" value={kyc.phoneNumber} />
              <InfoRow icon={MapPin} label="Address" value={kyc.address} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow icon={FileText} label="Document Type" value={kyc.documentType} />
              <InfoRow icon={CreditCard} label="Document Number" value={kyc.documentNumber} />
              {kyc.documentCID && (
                <InfoRow icon={FileText} label="Document CID (IPFS)" value={kyc.documentCID} />
              )}
            </CardContent>
          </Card>

          {(kyc.requestedRole || kyc.professionalLicense || kyc.institutionName) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kyc.requestedRole && (
                  <div className="flex items-start gap-3 py-2">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Requested Role</Label>
                      <Badge variant="outline" className="font-medium">
                        {kyc.requestedRole.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                )}
                {kyc.professionalLicense && (
                  <InfoRow icon={Shield} label="Professional License" value={kyc.professionalLicense} />
                )}
                {kyc.institutionName && (
                  <InfoRow icon={Building} label="Institution Name" value={kyc.institutionName} />
                )}
              </CardContent>
            </Card>
          )}

          {(kyc.selectedHospital || kyc.country || kyc.state || kyc.location || kyc.hospitalProfile) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hospital className="h-4 w-4" />
                  Hospital / Location Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {kyc.selectedHospital && (
                  <InfoRow icon={Hospital} label="Selected Hospital" value={kyc.selectedHospital} />
                )}
                {kyc.country && (
                  <InfoRow icon={MapPin} label="Country" value={kyc.country} />
                )}
                {kyc.state && (
                  <InfoRow icon={MapPin} label="State" value={kyc.state} />
                )}
                {kyc.location && (
                  <InfoRow icon={MapPin} label="Location" value={kyc.location} />
                )}
                {kyc.hospitalProfile && (
                  <div className="flex items-start gap-3 py-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Hospital Profile</Label>
                      <p className="text-sm font-medium whitespace-pre-wrap">{kyc.hospitalProfile}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Submission Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Submitted At</Label>
                  <p className="text-sm font-medium">
                    {new Date(kyc.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 py-2">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge 
                    variant={kyc.status === "approved" ? "default" : kyc.status === "rejected" ? "destructive" : "secondary"}
                  >
                    {kyc.status}
                  </Badge>
                </div>
              </div>
              {kyc.reviewedAt && (
                <div className="flex items-start gap-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Reviewed At</Label>
                    <p className="text-sm font-medium">
                      {new Date(kyc.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {kyc.rejectionReason && (
                <div className="flex items-start gap-3 py-2">
                  <FileText className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                    <p className="text-sm font-medium text-destructive">{kyc.rejectionReason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
