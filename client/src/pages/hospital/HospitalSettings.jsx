import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building, MapPin, Phone, Settings, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import QRGeneratorCard from "@/components/QRGeneratorCard";
import HealthProfileForm from "@/components/HealthProfileForm";
export default function HospitalSettings() {
    const { walletAddress } = useWallet();
    const { toast } = useToast();
    const [settingsData, setSettingsData] = useState({
        hospitalName: "",
        username: "",
        email: "",
        registrationNumber: "",
        hospitalType: "",
        numberOfBeds: "",
        streetAddress: "",
        city: "",
        stateRegion: "",
        postalCode: "",
        mainPhone: "",
        emergencyLine: "",
        website: "",
        emergencyServices: true,
        outpatientServices: true,
        insuranceClaims: true,
        specialties: "",
    });
    const { data: userProfile } = useQuery({
        queryKey: ["/api/user/profile"],
        enabled: !!walletAddress,
    });
    useEffect(() => {
        if (userProfile) {
            setSettingsData(prev => ({
                ...prev,
                hospitalName: userProfile.hospitalName || "",
                username: userProfile.username || "",
                email: userProfile.email || "",
            }));
        }
    }, [userProfile]);
    const updateSettingsMutation = useMutation({
        mutationFn: (data) => apiRequest("PUT", "/api/user/profile", {
            username: data.username,
            email: data.email,
            hospitalName: data.hospitalName,
        }),
        onSuccess: () => {
            toast({
                title: "Settings Updated",
                description: "Your hospital settings have been saved successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
        },
        onError: () => {
            toast({
                title: "Update Failed",
                description: "Failed to update settings. Please try again.",
                variant: "destructive",
            });
        },
    });
    const handleSubmit = (e) => {
        e.preventDefault();
        updateSettingsMutation.mutate(settingsData);
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hospital Settings</h1>
        <p className="text-muted-foreground">Configure your hospital information and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfilePictureUpload />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5"/>
                <CardTitle>Hospital Information</CardTitle>
              </div>
              <CardDescription>Basic facility details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <Input id="hospitalName" value={settingsData.hospitalName} onChange={(e) => setSettingsData({ ...settingsData, hospitalName: e.target.value })} placeholder="City General Hospital" data-testid="input-hospital-name"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">System Username</Label>
                <Input id="username" value={settingsData.username} onChange={(e) => setSettingsData({ ...settingsData, username: e.target.value })} placeholder="city_hospital" data-testid="input-username"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input id="registrationNumber" value={settingsData.registrationNumber} onChange={(e) => setSettingsData({ ...settingsData, registrationNumber: e.target.value })} placeholder="HOSP-12345" data-testid="input-registration"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalType">Hospital Type</Label>
                <Input id="hospitalType" value={settingsData.hospitalType} onChange={(e) => setSettingsData({ ...settingsData, hospitalType: e.target.value })} placeholder="General / Specialty / Teaching" data-testid="input-type"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfBeds">Number of Beds</Label>
                <Input id="numberOfBeds" type="number" value={settingsData.numberOfBeds} onChange={(e) => setSettingsData({ ...settingsData, numberOfBeds: e.target.value })} placeholder="250" data-testid="input-beds"/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5"/>
                <CardTitle>Location</CardTitle>
              </div>
              <CardDescription>Hospital address and contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input id="streetAddress" value={settingsData.streetAddress} onChange={(e) => setSettingsData({ ...settingsData, streetAddress: e.target.value })} placeholder="123 Healthcare Ave" data-testid="input-street"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={settingsData.city} onChange={(e) => setSettingsData({ ...settingsData, city: e.target.value })} placeholder="Lagos" data-testid="input-city"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateRegion">State/Region</Label>
                <Input id="stateRegion" value={settingsData.stateRegion} onChange={(e) => setSettingsData({ ...settingsData, stateRegion: e.target.value })} placeholder="Lagos State" data-testid="input-state"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input id="postalCode" value={settingsData.postalCode} onChange={(e) => setSettingsData({ ...settingsData, postalCode: e.target.value })} placeholder="100001" data-testid="input-postal"/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5"/>
                <CardTitle>Contact Information</CardTitle>
              </div>
              <CardDescription>Communication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainPhone">Main Phone</Label>
                <Input id="mainPhone" type="tel" value={settingsData.mainPhone} onChange={(e) => setSettingsData({ ...settingsData, mainPhone: e.target.value })} placeholder="+234 123 456 7890" data-testid="input-main-phone"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyLine">Emergency Line</Label>
                <Input id="emergencyLine" type="tel" value={settingsData.emergencyLine} onChange={(e) => setSettingsData({ ...settingsData, emergencyLine: e.target.value })} placeholder="+234 911 000 0000" data-testid="input-emergency-line"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={settingsData.email} onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })} placeholder="info@cityhospital.ng" data-testid="input-email"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" value={settingsData.website} onChange={(e) => setSettingsData({ ...settingsData, website: e.target.value })} placeholder="https://cityhospital.ng" data-testid="input-website"/>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5"/>
                <CardTitle>Service Settings</CardTitle>
              </div>
              <CardDescription>Configure hospital services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>24/7 Emergency Services</Label>
                  <p className="text-sm text-muted-foreground">Always available emergency care</p>
                </div>
                <Switch checked={settingsData.emergencyServices} onCheckedChange={(checked) => setSettingsData({ ...settingsData, emergencyServices: checked })} data-testid="switch-emergency"/>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Outpatient Services</Label>
                  <p className="text-sm text-muted-foreground">Walk-in consultations</p>
                </div>
                <Switch checked={settingsData.outpatientServices} onCheckedChange={(checked) => setSettingsData({ ...settingsData, outpatientServices: checked })} data-testid="switch-outpatient"/>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Insurance Claims Processing</Label>
                  <p className="text-sm text-muted-foreground">Accept insurance payments</p>
                </div>
                <Switch checked={settingsData.insuranceClaims} onCheckedChange={(checked) => setSettingsData({ ...settingsData, insuranceClaims: checked })} data-testid="switch-insurance"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties Offered</Label>
                <Textarea id="specialties" value={settingsData.specialties} onChange={(e) => setSettingsData({ ...settingsData, specialties: e.target.value })} placeholder="Cardiology, Neurology, Pediatrics..." rows={3} data-testid="input-specialties"/>
              </div>
            </CardContent>
          </Card>

          <QRGeneratorCard />
        </div>

        <div className="mt-6">
          <HealthProfileForm />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" type="button" data-testid="button-cancel">Cancel</Button>
          <Button type="submit" disabled={updateSettingsMutation.isPending} data-testid="button-save">
            {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save Settings
          </Button>
        </div>
      </form>
    </div>);
}
