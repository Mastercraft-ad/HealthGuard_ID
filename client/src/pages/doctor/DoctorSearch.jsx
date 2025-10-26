import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/contexts/WalletContext";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Loader2, Send } from "lucide-react";
export default function DoctorSearch() {
    const { uid } = useWallet();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestReason, setRequestReason] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim())
            return;
        setIsSearching(true);
        try {
            const walletAddress = localStorage.getItem("walletAddress");
            const response = await fetch(`/api/doctor/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    ...(walletAddress ? { "x-wallet-address": walletAddress } : {}),
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResult(data);
            }
            else {
                toast({ title: "Not Found", description: "No patient found with that UID or username", variant: "destructive" });
                setSearchResult(null);
            }
        }
        catch (error) {
            toast({ title: "Search Failed", description: "Unable to search for patient", variant: "destructive" });
        }
        finally {
            setIsSearching(false);
        }
    };
    const requestAccessMutation = useMutation({
        mutationFn: (data) => apiRequest("POST", "/api/doctor/request-access", data),
        onSuccess: () => {
            toast({ title: "Access Requested", description: "Patient will receive your request for approval" });
            queryClient.invalidateQueries({ queryKey: ["/api/doctor/access-requests"] });
            setRequestDialogOpen(false);
            setRequestReason("");
        },
    });
    const handleRequestAccess = () => {
        if (!searchResult || !requestReason.trim())
            return;
        requestAccessMutation.mutate({
            patientId: searchResult.id,
            reason: requestReason,
        });
    };
    return (<div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Search</h1>
        <p className="text-muted-foreground">Find patients by UID or username to request access</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search for Patient</CardTitle>
          <CardDescription>Enter patient UID or username</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input placeholder="Enter UID or username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} data-testid="input-search-patient"/>
            </div>
            <Button type="submit" disabled={isSearching} data-testid="button-search">
              {isSearching ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<Search className="h-4 w-4"/>)}
              <span className="ml-2">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResult && (<Card data-testid="card-search-result">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Patient Found</CardTitle>
                <CardDescription>Patient information and access status</CardDescription>
              </div>
              <Badge variant={searchResult.hasAccess ? "default" : "outline"}>
                {searchResult.hasAccess ? "Access Granted" : "No Access"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium" data-testid="text-result-username">{searchResult.username}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">UID</p>
                  <p className="font-mono text-sm" data-testid="text-result-uid">{searchResult.uid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={searchResult.status === "verified" ? "default" : "outline"}>
                    {searchResult.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Records Count</p>
                  <p className="font-semibold">{searchResult.recordCount || 0} documents</p>
                </div>
              </div>

              {!searchResult.hasAccess && (<Button className="w-full gap-2" onClick={() => setRequestDialogOpen(true)} data-testid="button-request-access">
                  <Send className="h-4 w-4"/>
                  Request Access to Medical Records
                </Button>)}

              {searchResult.hasAccess && (<div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm font-medium mb-2">You have access to this patient's records</p>
                  <Button variant="outline" className="gap-2" data-testid="button-view-records">
                    <FileText className="h-4 w-4"/>
                    View Medical Records
                  </Button>
                </div>)}
            </div>
          </CardContent>
        </Card>)}

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              Explain why you need access to this patient's medical records
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access</Label>
              <Textarea id="reason" value={requestReason} onChange={(e) => setRequestReason(e.target.value)} placeholder="e.g., Scheduled consultation for cardiac evaluation" rows={4} data-testid="input-access-reason"/>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestAccess} disabled={!requestReason.trim() || requestAccessMutation.isPending} data-testid="button-submit-request">
                {requestAccessMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
