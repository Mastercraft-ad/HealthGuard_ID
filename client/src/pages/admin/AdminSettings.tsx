import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Shield, Database, Bell } from "lucide-react";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <ProfilePictureUpload />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Configure authentication and access control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require KYC for all users</Label>
                <p className="text-sm text-muted-foreground">Users must complete KYC before accessing features</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-approve verified institutions</Label>
                <p className="text-sm text-muted-foreground">Automatically verify known healthcare providers</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable emergency QR access</Label>
                <p className="text-sm text-muted-foreground">Allow emergency responders to scan QR codes</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Settings</CardTitle>
            </div>
            <CardDescription>Configure data retention and backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Audit Log Retention (days)</Label>
              <Input type="number" defaultValue="365" />
              <p className="text-sm text-muted-foreground">How long to keep audit logs</p>
            </div>
            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Input defaultValue="Daily at 2:00 AM" disabled />
              <p className="text-sm text-muted-foreground">Automatic database backups</p>
            </div>
            <Button variant="outline" className="w-full">Run Manual Backup</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Configure system notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>KYC submission alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on new KYC submissions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Role application alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on role change requests</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System error alerts</Label>
                <p className="text-sm text-muted-foreground">Notify on critical errors</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="HealthGuardX" />
            </div>
            <div className="space-y-2">
              <Label>Admin Wallet Address</Label>
              <Input defaultValue="0x3c17f3F514658fACa2D24DE1d29F542a836FD10A" disabled />
              <p className="text-sm text-muted-foreground">The designated admin wallet</p>
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
