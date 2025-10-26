import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function HealthProfileForm() {
  const { toast } = useToast();
  const [healthData, setHealthData] = useState({
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    currentMedications: "",
    emergencyContact: "",
    emergencyPhone: "",
    height: "",
    weight: "",
    organDonor: false,
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/user/health-profile"],
  });

  useEffect(() => {
    if (profile) {
      setHealthData({
        bloodType: profile.bloodType || "",
        allergies: profile.allergies?.join(", ") || "",
        chronicConditions: profile.chronicConditions?.join(", ") || "",
        currentMedications: profile.currentMedications?.join(", ") || "",
        emergencyContact: profile.emergencyContact || "",
        emergencyPhone: profile.emergencyPhone || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        organDonor: profile.organDonor || false,
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/user/health-profile", data),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your health profile has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/health-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/profile"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update health profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      bloodType: healthData.bloodType,
      allergies: healthData.allergies.split(",").map(a => a.trim()).filter(Boolean),
      chronicConditions: healthData.chronicConditions.split(",").map(c => c.trim()).filter(Boolean),
      currentMedications: healthData.currentMedications.split(",").map(m => m.trim()).filter(Boolean),
      emergencyContact: healthData.emergencyContact,
      emergencyPhone: healthData.emergencyPhone,
      height: healthData.height ? parseFloat(healthData.height) : undefined,
      weight: healthData.weight ? parseFloat(healthData.weight) : undefined,
      organDonor: healthData.organDonor,
    };
    updateProfileMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Profile</CardTitle>
        <CardDescription>Emergency medical information (encrypted and secure)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select value={healthData.bloodType} onValueChange={(v) => setHealthData({ ...healthData, bloodType: v })}>
                <SelectTrigger data-testid="select-blood-type">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={healthData.height}
                onChange={(e) => setHealthData({ ...healthData, height: e.target.value })}
                data-testid="input-height"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={healthData.weight}
                onChange={(e) => setHealthData({ ...healthData, weight: e.target.value })}
                data-testid="input-weight"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Input
              id="allergies"
              value={healthData.allergies}
              onChange={(e) => setHealthData({ ...healthData, allergies: e.target.value })}
              placeholder="e.g., Penicillin, Peanuts, Latex"
              data-testid="input-allergies"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chronicConditions">Chronic Conditions (comma-separated)</Label>
            <Input
              id="chronicConditions"
              value={healthData.chronicConditions}
              onChange={(e) => setHealthData({ ...healthData, chronicConditions: e.target.value })}
              placeholder="e.g., Diabetes, Hypertension"
              data-testid="input-chronic-conditions"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentMedications">Current Medications (comma-separated)</Label>
            <Input
              id="currentMedications"
              value={healthData.currentMedications}
              onChange={(e) => setHealthData({ ...healthData, currentMedications: e.target.value })}
              placeholder="e.g., Metformin 500mg, Aspirin 81mg"
              data-testid="input-medications"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input
                id="emergencyContact"
                value={healthData.emergencyContact}
                onChange={(e) => setHealthData({ ...healthData, emergencyContact: e.target.value })}
                data-testid="input-emergency-contact"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={healthData.emergencyPhone}
                onChange={(e) => setHealthData({ ...healthData, emergencyPhone: e.target.value })}
                data-testid="input-emergency-phone"
              />
            </div>
          </div>
          <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-update-profile">
            {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Health Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
