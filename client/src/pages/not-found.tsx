import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground text-center mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => setLocation("/")} className="gap-2" data-testid="button-home">
            <Home className="h-4 w-4" />
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
