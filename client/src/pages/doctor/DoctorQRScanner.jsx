import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QrCode, User, Heart, AlertTriangle, Pill, Phone, Building2, Clock, CheckCircle, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
export default function DoctorQRScanner() {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [patientInfo, setPatientInfo] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [scanner, setScanner] = useState(null);
    useEffect(() => {
        return () => {
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [scanner]);
    const startScanning = () => {
        setIsScanning(true);
        const html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
        }, false);
        html5QrcodeScanner.render(async (decodedText) => {
            try {
                // Stop scanning
                html5QrcodeScanner.clear();
                setIsScanning(false);
                // Send QR data to backend for verification
                const response = await apiRequest("POST", "/api/qr/scan", {
                    qrData: decodedText,
                });
                if (response.success && response.patientInfo) {
                    setPatientInfo(response.patientInfo);
                    setDialogOpen(true);
                    toast({
                        title: "QR Code Scanned",
                        description: `Patient ${response.patientInfo.username} information loaded`,
                    });
                }
            }
            catch (error) {
                toast({
                    title: "Scan Failed",
                    description: error.message || "Failed to scan QR code",
                    variant: "destructive",
                });
                setIsScanning(false);
            }
        }, (errorMessage) => {
            // Ignore scan errors (they happen continuously while scanning)
            console.log("QR scan error:", errorMessage);
        });
        setScanner(html5QrcodeScanner);
    };
    const stopScanning = () => {
        if (scanner) {
            scanner.clear().catch(console.error);
            setScanner(null);
        }
        setIsScanning(false);
    };
    return (<div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-clinical-green-600 dark:text-clinical-green-400" data-testid="text-qr-scanner-title">
          QR Code Scanner
        </h1>
        <p className="text-muted-foreground mt-2" data-testid="text-qr-scanner-description">
          Scan patient emergency QR codes to access critical medical information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5"/>
            Emergency QR Scanner
          </CardTitle>
          <CardDescription>
            Position the patient's emergency QR code within the camera frame
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning ? (<div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-clinical-green-50 dark:bg-clinical-green-900/20 mb-4">
                <Camera className="w-12 h-12 text-clinical-green-600 dark:text-clinical-green-400"/>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
              <p className="text-muted-foreground mb-6">
                Click the button below to activate the camera and start scanning
              </p>
              <Button onClick={startScanning} size="lg" className="bg-clinical-green-600 hover:bg-clinical-green-700" data-testid="button-start-scan">
                <QrCode className="w-5 h-5 mr-2"/>
                Start Scanning
              </Button>
            </div>) : (<div className="space-y-4">
              <Alert>
                <Camera className="w-4 h-4"/>
                <AlertDescription>
                  Camera is active. Point your camera at the patient's QR code to scan.
                </AlertDescription>
              </Alert>
              <div id="qr-reader" className="w-full" data-testid="div-qr-reader"></div>
              <Button onClick={stopScanning} variant="outline" className="w-full" data-testid="button-stop-scan">
                Stop Scanning
              </Button>
            </div>)}
        </CardContent>
      </Card>

      {/* Patient Emergency Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5"/>
              Emergency Patient Information
            </DialogTitle>
            <DialogDescription>
              Critical medical information for emergency response
            </DialogDescription>
          </DialogHeader>

          {patientInfo && (<div className="space-y-6">
              {/* Patient Identity */}
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
                {patientInfo.profilePicture ? (<img src={patientInfo.profilePicture} alt={patientInfo.username} className="w-16 h-16 rounded-full object-cover" data-testid="img-patient-avatar"/>) : (<div className="w-16 h-16 rounded-full bg-medical-blue-100 dark:bg-medical-blue-900/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-medical-blue-600 dark:text-medical-blue-400"/>
                  </div>)}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" data-testid="text-patient-name">{patientInfo.username}</h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-patient-uid">UID: {patientInfo.uid}</p>
                  {patientInfo.hospitalName && (<div className="flex items-center gap-2 mt-2 text-sm">
                      <Building2 className="w-4 h-4"/>
                      <span data-testid="text-patient-hospital">{patientInfo.hospitalName}</span>
                    </div>)}
                </div>
              </div>

              {patientInfo.emergencyDetails ? (<div className="space-y-4">
                  {/* Blood Type */}
                  {patientInfo.emergencyDetails.bloodType && (<div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-red-500"/>
                        <h4 className="font-semibold">Blood Type</h4>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold" data-testid="badge-blood-type">
                        {patientInfo.emergencyDetails.bloodType}
                      </Badge>
                    </div>)}

                  {/* Allergies */}
                  {patientInfo.emergencyDetails.allergies && patientInfo.emergencyDetails.allergies.length > 0 && (<div className="p-4 border rounded-lg bg-alert-orange-50 dark:bg-alert-orange-900/20 border-alert-orange-200 dark:border-alert-orange-800">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-alert-orange-600"/>
                        <h4 className="font-semibold text-alert-orange-900 dark:text-alert-orange-100">Critical: Allergies</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {patientInfo.emergencyDetails.allergies.map((allergy, index) => (<Badge key={index} variant="destructive" data-testid={`badge-allergy-${index}`}>
                            {allergy}
                          </Badge>))}
                      </div>
                    </div>)}

                  {/* Chronic Conditions */}
                  {patientInfo.emergencyDetails.chronicConditions && patientInfo.emergencyDetails.chronicConditions.length > 0 && (<div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 text-medical-blue-600"/>
                        <h4 className="font-semibold">Chronic Conditions</h4>
                      </div>
                      <div className="space-y-2">
                        {patientInfo.emergencyDetails.chronicConditions.map((condition, index) => (<div key={index} className="text-sm p-2 bg-muted rounded" data-testid={`text-condition-${index}`}>
                            {condition}
                          </div>))}
                      </div>
                    </div>)}

                  {/* Current Medications */}
                  {patientInfo.emergencyDetails.currentMedications && patientInfo.emergencyDetails.currentMedications.length > 0 && (<div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-5 h-5 text-clinical-green-600"/>
                        <h4 className="font-semibold">Current Medications</h4>
                      </div>
                      <div className="space-y-2">
                        {patientInfo.emergencyDetails.currentMedications.map((medication, index) => (<div key={index} className="text-sm p-2 bg-muted rounded flex items-center gap-2" data-testid={`text-medication-${index}`}>
                            <CheckCircle className="w-4 h-4 text-clinical-green-600"/>
                            {medication}
                          </div>))}
                      </div>
                    </div>)}

                  {/* Emergency Contact */}
                  {(patientInfo.emergencyDetails.emergencyContact || patientInfo.emergencyDetails.emergencyPhone) && (<div className="p-4 border rounded-lg bg-clinical-green-50 dark:bg-clinical-green-900/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-5 h-5 text-clinical-green-600"/>
                        <h4 className="font-semibold">Emergency Contact</h4>
                      </div>
                      <div className="space-y-2">
                        {patientInfo.emergencyDetails.emergencyContact && (<p className="text-sm" data-testid="text-emergency-contact">
                            <span className="font-medium">Name:</span> {patientInfo.emergencyDetails.emergencyContact}
                          </p>)}
                        {patientInfo.emergencyDetails.emergencyPhone && (<p className="text-sm" data-testid="text-emergency-phone">
                            <span className="font-medium">Phone:</span>{" "}
                            <a href={`tel:${patientInfo.emergencyDetails.emergencyPhone}`} className="text-clinical-green-600 hover:underline">
                              {patientInfo.emergencyDetails.emergencyPhone}
                            </a>
                          </p>)}
                      </div>
                    </div>)}
                </div>) : (<Alert>
                  <AlertTriangle className="w-4 h-4"/>
                  <AlertDescription>
                    No emergency medical details available for this patient
                  </AlertDescription>
                </Alert>)}

              {/* Scan Timestamp */}
              {patientInfo.timestamp && (<div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Clock className="w-4 h-4"/>
                  <span>
                    QR Code generated: {format(new Date(patientInfo.timestamp), "PPpp")}
                  </span>
                </div>)}

              <Button onClick={() => {
                setDialogOpen(false);
                setPatientInfo(null);
            }} className="w-full" data-testid="button-close-dialog">
                Close
              </Button>
            </div>)}
        </DialogContent>
      </Dialog>
    </div>);
}
