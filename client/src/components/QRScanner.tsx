import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QrCode, AlertTriangle, Heart, User, Camera, X, FileUp, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";

interface ScannedData {
  username: string;
  uid: string;
  walletAddress: string;
  profilePicture?: string;
  role: string;
  hospitalName?: string;
  emergencyDetails?: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
    emergencyContact?: string;
    emergencyPhone?: string;
  };
}

interface QRScannerProps {
  onAccessRequested?: () => void;
}

export default function QRScanner({ onAccessRequested }: QRScannerProps) {
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState<"emergency" | "normal">("normal");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofDetails, setProofDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerInitializedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { role } = useWallet();

  useEffect(() => {
    const initScanner = async () => {
      if (scanning && !scannerInitializedRef.current) {
        scannerInitializedRef.current = true;
        try {
          const html5QrCode = new Html5Qrcode("qr-reader");
          html5QrCodeRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          };

          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              try {
                const response = await apiRequest("POST", "/api/emergency/verify-qr", {
                  qrData: decodedText,
                });
                const data = await response.json();

                if (data?.success) {
                  setScannedData(data.data);
                  toast({
                    title: "QR Code Scanned",
                    description: "Patient information loaded successfully",
                  });
                  stopScanning();
                }
              } catch (error: any) {
                toast({
                  title: "Verification Failed",
                  description: error.message || "Failed to verify QR code",
                  variant: "destructive",
                });
              }
            },
            (errorMessage) => {
              console.log("QR scan error:", errorMessage);
            }
          );
        } catch (err: any) {
          console.error("Camera error:", err);
          setCameraError(err.message || "Failed to access camera");
          setScanning(false);
          scannerInitializedRef.current = false;
          toast({
            title: "Camera Error",
            description: "Unable to access camera. Please ensure camera permissions are granted.",
            variant: "destructive",
          });
        }
      }
    };

    initScanner();

    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
        scannerInitializedRef.current = false;
      }
    };
  }, [scanning, toast]);

  const startScanning = () => {
    setScanning(true);
    setCameraError(null);
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Stop scanning error:", err);
      }
    }
    setScanning(false);
    scannerInitializedRef.current = false;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQRFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG or JPG image containing a QR code.",
        variant: "destructive",
      });
      return;
    }

    setUploadingQR(true);
    let html5QrCode: Html5Qrcode | null = null;
    try {
      html5QrCode = new Html5Qrcode("qr-file-reader");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      console.log("Decoded QR text:", decodedText);
      
      const response = await apiRequest("POST", "/api/emergency/verify-qr", {
        qrData: decodedText,
      });
      const data = await response.json();
      
      console.log("API response:", data);

      if (data?.success) {
        console.log("Setting scanned data:", data.data);
        setScannedData(data.data);
        toast({
          title: "QR Code Scanned",
          description: "Patient information loaded successfully from uploaded file",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "The QR code could not be verified. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("QR scan error:", error);
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan QR code from the uploaded file. Please ensure the image is clear and contains a valid QR code.",
        variant: "destructive",
      });
    } finally {
      if (html5QrCode) {
        html5QrCode.clear();
      }
      setUploadingQR(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
    }
  };

  const handleRequestAccess = async () => {
    if (!scannedData) return;

    setSubmitting(true);
    try {
      // First, get patient ID from UID - use role-specific search endpoint
      const searchEndpoint = role === "emergency_responder" 
        ? `/api/emergency/search?query=${scannedData.uid}`
        : `/api/doctor/search?query=${scannedData.uid}`;
      
      console.log("Searching for patient:", searchEndpoint);
      const patientResponse = await apiRequest("GET", searchEndpoint);
      
      if (!patientResponse.ok) {
        const errorData = await patientResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to find patient");
      }
      
      const patient = await patientResponse.json();
      console.log("Patient found:", patient);
      
      if (!patient?.id) {
        throw new Error("Invalid patient data received");
      }
      
      console.log("Sending access request for patient:", patient.id);
      const accessResponse = await apiRequest("POST", "/api/user/request-access", {
        patientId: patient.id,
        reason: proofDetails || `${requestType === "emergency" ? "Emergency" : "Normal"} access request`,
        isEmergency: requestType === "emergency",
        proofImage: requestType === "emergency" ? proofImage : null,
        proofDetails: proofDetails || null,
      });
      
      if (!accessResponse.ok) {
        const errorData = await accessResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send access request");
      }

      toast({
        title: "Access Request Sent",
        description: `Your ${requestType} access request has been sent to the patient${requestType === "emergency" && scannedData.hospitalName ? " and their hospital" : ""}.`,
      });

      setShowRequestDialog(false);
      setProofImage(null);
      setProofDetails("");
      setRequestType("normal");
      
      if (onAccessRequested) {
        onAccessRequested();
      }
    } catch (error: any) {
      console.error("Request access error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send access request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div id="qr-file-reader" style={{ display: 'none' }}></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
            <CardDescription>Point camera at QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!scanning && !scannedData && (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                  <QrCode className="h-24 w-24 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6">Ready to scan QR code</p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    <Button 
                      onClick={startScanning}
                      size="lg"
                      className="gap-2 flex-1"
                      data-testid="button-start-scan"
                    >
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </Button>
                    <Button 
                      onClick={() => qrFileInputRef.current?.click()}
                      size="lg"
                      variant="outline"
                      className="gap-2 flex-1"
                      disabled={uploadingQR}
                      data-testid="button-upload-qr"
                    >
                      {uploadingQR ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4" />
                          Upload QR
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={qrFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleQRFileUpload}
                    className="hidden"
                    data-testid="input-qr-file"
                  />
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Upload a QR code image (PNG or JPG)
                  </p>
                </div>
              )}

              {scanning && (
                <div className="space-y-4">
                  <div 
                    id="qr-reader" 
                    className="w-full rounded-lg overflow-hidden"
                    data-testid="qr-reader"
                  />
                  <Button 
                    onClick={stopScanning}
                    variant="destructive"
                    className="w-full gap-2"
                    data-testid="button-stop-scan"
                  >
                    <X className="h-4 w-4" />
                    Stop Scanning
                  </Button>
                </div>
              )}

              {cameraError && !scanning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{cameraError}</AlertDescription>
                </Alert>
              )}

              {scannedData && !scanning && (
                <div className="text-center py-8">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <p className="font-medium">QR Code Scanned Successfully</p>
                  <p className="text-sm text-muted-foreground">Information displayed on the right</p>
                  <Button 
                    onClick={() => {
                      setScannedData(null);
                      setCameraError(null);
                    }}
                    className="mt-4"
                    data-testid="button-scan-another"
                  >
                    Scan Another QR Code
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
            <CardDescription>Scanned user details</CardDescription>
          </CardHeader>
          <CardContent>
            {!scannedData ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4" />
                <p>Scan a QR code to view information</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="patient-info">
                {scannedData.profilePicture && (
                  <div className="flex justify-center pb-4 border-b">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={scannedData.profilePicture} alt={scannedData.username} />
                      <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">UID</p>
                  <p className="font-mono font-semibold" data-testid="text-patient-uid">{scannedData.uid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium" data-testid="text-patient-username">{scannedData.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline" data-testid="text-role">{scannedData.role}</Badge>
                </div>
                {scannedData.hospitalName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Hospital</p>
                    <p className="font-medium" data-testid="text-hospital-name">{scannedData.hospitalName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="font-mono text-sm" data-testid="text-wallet-address">{scannedData.walletAddress}</p>
                </div>
                {scannedData.emergencyDetails && (
                  <>
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-destructive" />
                        <p className="font-semibold">Emergency Information</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Blood Type</p>
                      <p className="text-lg font-bold text-destructive" data-testid="text-blood-type">
                        {scannedData.emergencyDetails.bloodType || "Not specified"}
                      </p>
                    </div>
                    {scannedData.emergencyDetails.allergies && scannedData.emergencyDetails.allergies.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Allergies</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scannedData.emergencyDetails.allergies.map((allergy: string, i: number) => (
                            <Badge key={i} variant="destructive">{allergy}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {scannedData.emergencyDetails.chronicConditions && scannedData.emergencyDetails.chronicConditions.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Chronic Conditions</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scannedData.emergencyDetails.chronicConditions.map((condition: string, i: number) => (
                            <Badge key={i} variant="outline">{condition}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {scannedData.emergencyDetails.currentMedications && scannedData.emergencyDetails.currentMedications.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Current Medications</p>
                        <ul className="list-disc list-inside mt-1 text-sm">
                          {scannedData.emergencyDetails.currentMedications.map((med: string, i: number) => (
                            <li key={i}>{med}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {scannedData.emergencyDetails.emergencyContact && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium" data-testid="text-emergency-contact">
                          {scannedData.emergencyDetails.emergencyContact}
                        </p>
                        {scannedData.emergencyDetails.emergencyPhone && (
                          <p className="text-sm font-mono" data-testid="text-emergency-phone">
                            {scannedData.emergencyDetails.emergencyPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                <div className="pt-4 border-t space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={() => setShowRequestDialog(true)}
                    data-testid="button-request-details"
                  >
                    Request More Details
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => {
                      setScannedData(null);
                      setCameraError(null);
                    }}
                    data-testid="button-clear-scan"
                  >
                    Clear & Scan Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent data-testid="dialog-request-access">
          <DialogHeader>
            <DialogTitle>Request More Details</DialogTitle>
            <DialogDescription>
              Request additional access to {scannedData?.username}'s medical records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <RadioGroup value={requestType} onValueChange={(v: any) => setRequestType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" data-testid="radio-normal" />
                  <Label htmlFor="normal" className="font-normal">Normal Request</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emergency" id="emergency" data-testid="radio-emergency" />
                  <Label htmlFor="emergency" className="font-normal">Emergency Request</Label>
                </div>
              </RadioGroup>
            </div>

            {requestType === "emergency" && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Emergency requests will be sent to both the patient and their hospital for faster approval.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Proof Image (Optional)</Label>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      data-testid="input-proof-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      data-testid="button-upload-proof"
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      {proofImage ? "Change Image" : "Upload Image"}
                    </Button>
                  </div>
                  {proofImage && (
                    <div className="mt-2">
                      <img src={proofImage} alt="Proof" className="max-h-40 rounded border" />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="details">Details/Reason</Label>
              <Textarea
                id="details"
                value={proofDetails}
                onChange={(e) => setProofDetails(e.target.value)}
                placeholder="Provide details about why you need access..."
                rows={4}
                data-testid="textarea-proof-details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={submitting}
              data-testid="button-cancel-request"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestAccess}
              disabled={submitting}
              data-testid="button-send-request"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
