import { useWallet } from "@/contexts/WalletContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, QrCode, Building, FileCheck, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
export default function Landing() {
    const { isConnected, connect, isConnecting, role } = useWallet();
    const [, setLocation] = useLocation();
    useEffect(() => {
        if (isConnected && role) {
            switch (role) {
                case "doctor":
                    setLocation("/doctor");
                    break;
                case "hospital":
                    setLocation("/hospital");
                    break;
                case "emergency_responder":
                    setLocation("/emergency");
                    break;
                case "insurance_provider":
                    setLocation("/insurance");
                    break;
                case "admin":
                    setLocation("/admin");
                    break;
                default:
                    setLocation("/patient");
            }
        }
    }, [isConnected, role, setLocation]);
    const features = [
        {
            icon: Shield,
            title: "Secure Identity",
            description: "Blockchain-based decentralized health identity with encrypted medical records",
        },
        {
            icon: QrCode,
            title: "Emergency Access",
            description: "QR/NFC codes provide instant access to critical health info for first responders",
        },
        {
            icon: FileCheck,
            title: "Verified Claims",
            description: "Smart contract-based insurance claims with cryptographic signatures",
        },
        {
            icon: Building,
            title: "Multi-Stakeholder",
            description: "Unified platform for patients, doctors, hospitals, insurers, and emergency services",
        },
        {
            icon: Zap,
            title: "Fast Processing",
            description: "Automated claim verification and approval with real-time blockchain audit trails",
        },
        {
            icon: Heart,
            title: "Patient-Owned",
            description: "You control who accesses your medical data with granular permission management",
        },
    ];
    return (<div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Heart className="h-6 w-6"/>
            </div>
            <div>
              <h1 className="text-xl font-bold">HealthGuardX</h1>
              <p className="text-xs text-muted-foreground">Decentralized Health Identity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!isConnected && (<Button onClick={connect} disabled={isConnecting} data-testid="button-connect-landing">
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>)}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="relative text-center mb-16 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 opacity-50"/>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200')] bg-cover bg-center opacity-10"/>
          <div className="relative z-10 py-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Lifesaving Medical Identity
              <br />
              <span className="text-primary">Universally Accessible</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Patient-owned, tamper-proof health records with instant emergency access.
              Blockchain-verified insurance claims. Built for African healthcare realities.
            </p>
            {!isConnected && (<Button size="lg" onClick={connect} disabled={isConnecting} className="gap-2">
                <Shield className="h-5 w-5"/>
                {isConnecting ? "Connecting Wallet..." : "Get Started - Connect Wallet"}
              </Button>)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (<Card key={index} className="hover-elevate">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-6 w-6"/>
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>))}
        </div>

        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Connect Wallet</h4>
              <p className="text-sm text-muted-foreground">
                Link your Web3 wallet to generate your unique health ID
              </p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Complete KYC</h4>
              <p className="text-sm text-muted-foreground">
                Submit encrypted identity verification for admin approval
              </p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Upload Records</h4>
              <p className="text-sm text-muted-foreground">
                Securely store medical records with client-side encryption
              </p>
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto mb-3 font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Generate QR</h4>
              <p className="text-sm text-muted-foreground">
                Create emergency access codes for first responders
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 mb-16">
          <h3 className="text-3xl font-bold text-center mb-12">About HealthGuardX</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">
                HealthGuardX is a revolutionary blockchain-based healthcare identity platform designed to address the unique challenges of African healthcare systems. Our mission is to ensure that every individual has access to their medical records when and where they need them most.
              </p>
              <p className="text-lg text-muted-foreground">
                By leveraging blockchain technology, we provide tamper-proof, patient-owned health records that can be accessed instantly during emergencies while maintaining the highest standards of privacy and security.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-5 w-5 text-primary"/>
                  <span>Bank-level Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-5 w-5 text-primary"/>
                  <span>Patient-Centric Design</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-5 w-5 text-primary"/>
                  <span>Instant Access</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-12 text-center">
              <div className="space-y-6">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">Patient Data Ownership</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Emergency Access</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">∞</div>
                  <p className="text-sm text-muted-foreground">Lifetime Record Storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16 bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Heart className="h-5 w-5"/>
                </div>
                <h3 className="font-bold">HealthGuardX</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Decentralized health identity for everyone. Secure, accessible, and patient-owned.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>For Patients</li>
                <li>For Doctors</li>
                <li>For Hospitals</li>
                <li>For Insurers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Security</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>GitHub</li>
                <li>Discord</li>
                <li>Twitter</li>
                <li>Contact Us</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              HealthGuardX - Built on BlockDAG | Secure • Decentralized • Patient-Owned
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 HealthGuardX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>);
}
