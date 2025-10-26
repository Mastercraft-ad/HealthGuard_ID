import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function WalletButton() {
  const { walletAddress, uid, role, status, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        data-testid="button-connect-wallet"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-wallet-menu">
          <div className="h-2 w-2 rounded-full bg-chart-2" />
          <span className="font-mono text-sm">{truncateAddress(walletAddress!)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wallet Info</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="font-mono text-sm" data-testid="text-wallet-address">{walletAddress}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">UID</p>
            <p className="font-mono text-sm" data-testid="text-uid">{uid}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge variant="secondary" data-testid="badge-role">{role}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={status === "verified" ? "default" : "outline"} data-testid="badge-status">
              {status}
            </Badge>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} data-testid="button-disconnect">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
