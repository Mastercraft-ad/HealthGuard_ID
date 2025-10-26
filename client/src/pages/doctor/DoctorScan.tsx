import QRScanner from "@/components/QRScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DoctorScan() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient QR Scanner</h1>
        <p className="text-muted-foreground">Scan patient QR codes to view emergency details and request access</p>
      </div>

      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          QR scans are logged and audited. Only scan QR codes with patient consent or in emergency situations.
        </AlertDescription>
      </Alert>

      <QRScanner onAccessRequested={() => {
        // Could navigate to requests page or show a toast
      }} />
    </div>
  );
}
