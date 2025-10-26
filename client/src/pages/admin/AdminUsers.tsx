import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWallet } from "@/contexts/WalletContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Ban, CheckCircle, Eye, User } from "lucide-react";
import { useState } from "react";
import UserDetailsDialog from "@/components/UserDetailsDialog";

export default function AdminUsers() {
  const { uid } = useWallet();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!uid,
    refetchInterval: 3000,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "User Status Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const filteredUsers = users?.filter((user: any) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.walletAddress.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const statusBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: { variant: "default", label: "Verified" },
      pending: { variant: "secondary", label: "Pending" },
      suspended: { variant: "destructive", label: "Suspended" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-500",
      doctor: "bg-blue-500/10 text-blue-500",
      hospital: "bg-green-500/10 text-green-500",
      insurance_provider: "bg-orange-500/10 text-orange-500",
      emergency_responder: "bg-red-500/10 text-red-500",
      patient: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={colors[role] || ""}>{role.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all registered users and their access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">
              {users?.filter((u: any) => u.status === "verified").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">
              {users?.filter((u: any) => u.status === "pending").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting KYC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {users?.filter((u: any) => u.status === "suspended").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Blocked users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Complete user directory</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profilePicture || undefined} alt={user.username} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-mono text-xs" data-testid={`text-user-uid-${user.id}`}>{user.uid}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-user-username-${user.id}`}>{user.username}</TableCell>
                    <TableCell className="font-mono text-xs" data-testid={`text-user-wallet-${user.id}`}>
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </TableCell>
                    <TableCell>{roleBadge(user.role)}</TableCell>
                    <TableCell>{statusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setDialogOpen(true);
                          }}
                          className="gap-1"
                          data-testid={`button-view-user-${user.id}`}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {user.status === "verified" ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: "suspended" })}
                            disabled={toggleStatusMutation.isPending || user.role === "admin"}
                            data-testid={`button-suspend-user-${user.id}`}
                          >
                            Suspend
                          </Button>
                        ) : user.status === "suspended" ? (
                          <Button
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, status: "verified" })}
                            disabled={toggleStatusMutation.isPending}
                            data-testid={`button-activate-user-${user.id}`}
                          >
                            Activate
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserDetailsDialog
        userId={selectedUserId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
