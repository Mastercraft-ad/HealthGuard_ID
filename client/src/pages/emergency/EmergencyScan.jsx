import QRScanner from "@/components/QRScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
export default function EmergencyScan() {
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency QR Scanner</h1>
        <p className="text-muted-foreground">Scan QR codes for instant emergency access</p>
      </div>

      <Alert className="border-destructive">
        <AlertTriangle className="h-4 w-4"/>
        <AlertDescription>
          Emergency access is logged and audited. Only scan QR codes in genuine emergency situations.
        </AlertDescription>
      </Alert>

      <QRScanner onAccessRequested={() => {
            // Could navigate to requests page or show a toast
        }}/>
    </div>);
}
