import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Download, RefreshCw, QrCode as QrCodeIcon, Shield, AlertTriangle, Loader2 } from "lucide-react";

export default function PatientQR() {
  const { uid, walletAddress, signMessage } = useWallet();
  const { toast } = useToast();

  const { data: qrData, isLoading } = useQuery<any>({
    queryKey: ["/api/patient/qr"],
    enabled: !!uid,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/patient/profile"],
    enabled: !!uid,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const message = `Generate Emergency QR Code for UID: ${uid}`;
      const signature = await signMessage(message);
      return apiRequest("POST", "/api/patient/qr", { signature });
    },
    onSuccess: () => {
      toast({ title: "QR Code Generated", description: "Your emergency access code is ready" });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/qr"] });
    },
  });

  const downloadQR = () => {
    const canvas = document.getElementById("emergency-qr") as HTMLCanvasElement;
    if (!canvas) return;

    const svg = canvas.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `healthid-emergency-${uid}.svg`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast({ title: "QR Code Downloaded", description: "Save this securely" });
  };

  const qrPayload = qrData?.qrData || "";
  const hasValidQRData = qrData && qrPayload && qrPayload.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency QR Code</h1>
        <p className="text-muted-foreground">Generate a scannable code for emergency responders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Emergency Access Code</CardTitle>
            <CardDescription>
              Present this QR code to emergency responders for instant access to critical health information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : hasValidQRData ? (
              <div className="space-y-6">
                <div className="flex justify-center" id="emergency-qr">
                  <div className="bg-white p-8 rounded-lg shadow-md">
                    <QRCodeSVG
                      value={qrPayload}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                    <div className="text-center mt-4">
                      <p className="font-mono text-sm text-gray-600">UID: {uid?.slice(0, 12)}...</p>
                      <p className="text-xs text-gray-500 mt-1">Emergency Access Code</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button onClick={downloadQR} variant="outline" className="gap-2" data-testid="button-download-qr">
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button onClick={() => window.print()} variant="outline" data-testid="button-print-qr">
                    Print QR Code
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Generated</p>
                    <p className="text-sm font-mono">{new Date(qrData.generatedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Scan Count</p>
                    <p className="text-sm font-semibold" data-testid="text-scan-count">{qrData.scanCount || 0} scans</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  data-testid="button-regenerate-qr"
                >
                  <RefreshCw className="h-4 w-4" />
                  {generateMutation.isPending ? "Generating..." : "Regenerate QR Code"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                  <QrCodeIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Emergency QR Code Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate your emergency access code to enable first responders to view your critical health information
                </p>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className="gap-2"
                  data-testid="button-generate-qr"
                >
                  {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <QrCodeIcon className="h-4 w-4" />
                  Generate Emergency QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency Information</CardTitle>
              <CardDescription>Data accessible via QR scan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Blood Type</p>
                    <p className="font-semibold text-lg text-destructive" data-testid="text-qr-blood-type">
                      {profile.bloodType || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Allergies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.allergies && profile.allergies.length > 0 ? (
                        profile.allergies.map((allergy: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Medications</p>
                    <div className="space-y-1 mt-1">
                      {profile.currentMedications && profile.currentMedications.length > 0 ? (
                        profile.currentMedications.slice(0, 3).map((med: string, i: number) => (
                          <p key={i} className="text-xs">{med}</p>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Emergency Contact</p>
                    <p className="text-sm">{profile.emergencyContact || "Not set"}</p>
                    {profile.emergencyPhone && (
                      <p className="text-xs text-muted-foreground font-mono">{profile.emergencyPhone}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Complete your health profile to enable emergency access
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <CardTitle className="text-base">Important</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Emergency responders can access critical info without your approval</span>
                </li>
                <li className="flex gap-2">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>All QR scans are logged in your audit trail</span>
                </li>
                <li className="flex gap-2">
                  <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Keep your QR code secure and only show to authorized personnel</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
