import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Loader2, Download, RefreshCw } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function QRGeneratorCard() {
  const [generatedQR, setGeneratedQR] = useState<any>(null);
  const { toast } = useToast();

  const { data: existingQR, isLoading: loadingExisting } = useQuery({
    queryKey: ["/api/user/qr"],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/user/qr", {}),
    onSuccess: (data) => {
      setGeneratedQR(data);
      toast({
        title: "QR Code Generated",
        description: "Your emergency QR code has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/qr"] });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const displayQR = generatedQR || existingQR;

  const downloadQR = () => {
    const canvas = document.querySelector("#qr-code-display canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "emergency-qr-code.png";
    link.href = url;
    link.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency QR Code</CardTitle>
        <CardDescription>
          Generate a QR code containing your emergency information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!displayQR && !loadingExisting && (
          <div className="text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
              <QrCode className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground mb-4">
              No QR code generated yet
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-qr"
            >
              {generateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate QR Code
            </Button>
          </div>
        )}

        {loadingExisting && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {displayQR && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                This QR code contains your emergency medical information.
                Share it with healthcare providers when needed.
              </AlertDescription>
            </Alert>

            <div
              id="qr-code-display"
              className="flex justify-center p-6 bg-white dark:bg-gray-100 rounded-lg"
              data-testid="qr-code-display"
            >
              <QRCodeSVG
                value={displayQR.qrData}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadQR}
                variant="outline"
                className="flex-1"
                data-testid="button-download-qr"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => generateMutation.mutate()}
                variant="outline"
                className="flex-1"
                disabled={generateMutation.isPending}
                data-testid="button-regenerate-qr"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>

            {displayQR.scanCount > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Scanned {displayQR.scanCount} time{displayQR.scanCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
