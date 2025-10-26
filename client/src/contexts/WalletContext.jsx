import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import MetaMaskSDK from "@metamask/sdk";
const WalletContext = createContext(undefined);
let sdkInstance = null;
let ethereumProvider = null;
function getIsMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
export function WalletProvider({ children }) {
    const [walletAddress, setWalletAddress] = useState(null);
    const [uid, setUid] = useState(null);
    const [role, setRole] = useState(null);
    const [status, setStatus] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    useEffect(() => {
        const storedAddress = localStorage.getItem("walletAddress");
        const storedUid = localStorage.getItem("uid");
        const storedRole = localStorage.getItem("role");
        const storedStatus = localStorage.getItem("status");
        if (storedAddress) {
            setWalletAddress(storedAddress);
            setUid(storedUid);
            setRole(storedRole);
            setStatus(storedStatus);
        }
        const isMobile = getIsMobile();
        if (isMobile && !sdkInstance) {
            sdkInstance = new MetaMaskSDK({
                dappMetadata: {
                    name: "HealthGuardX",
                    url: window.location.host,
                },
                checkInstallationImmediately: false,
                preferDesktop: false,
            });
            ethereumProvider = sdkInstance.getProvider();
        }
    }, []);
    const connect = async () => {
        const isMobile = getIsMobile();
        let provider;
        if (isMobile) {
            if (!sdkInstance) {
                sdkInstance = new MetaMaskSDK({
                    dappMetadata: {
                        name: "HealthGuardX",
                        url: window.location.host,
                    },
                    checkInstallationImmediately: false,
                    preferDesktop: false,
                });
                ethereumProvider = sdkInstance.getProvider();
            }
            provider = ethereumProvider;
        }
        else {
            if (!window.ethereum) {
                const dappUrl = window.location.host;
                const deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
                window.open(deepLink, '_blank');
                alert("Please install MetaMask browser extension or open this page in MetaMask mobile app");
                return;
            }
            provider = window.ethereum;
        }
        try {
            setIsConnecting(true);
            const accounts = await provider.request({
                method: "eth_requestAccounts",
                params: []
            });
            const address = accounts[0];
            const response = await fetch(`/api/auth/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress: address }),
            });
            if (response.ok) {
                const data = await response.json();
                setWalletAddress(address);
                setUid(data.uid);
                setRole(data.role);
                setStatus(data.status);
                localStorage.setItem("walletAddress", address);
                localStorage.setItem("uid", data.uid);
                localStorage.setItem("role", data.role);
                localStorage.setItem("status", data.status);
            }
        }
        catch (error) {
            console.error("Wallet connection failed:", error);
            if (isMobile) {
                alert("Please open this page in MetaMask mobile app or install MetaMask");
            }
        }
        finally {
            setIsConnecting(false);
        }
    };
    const disconnect = () => {
        setWalletAddress(null);
        setUid(null);
        setRole(null);
        setStatus(null);
        localStorage.removeItem("walletAddress");
        localStorage.removeItem("uid");
        localStorage.removeItem("role");
        localStorage.removeItem("status");
    };
    const refreshUserData = async () => {
        if (!walletAddress)
            return;
        try {
            const response = await fetch(`/api/auth/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ walletAddress }),
            });
            if (response.ok) {
                const data = await response.json();
                setUid(data.uid);
                setRole(data.role);
                setStatus(data.status);
                localStorage.setItem("uid", data.uid);
                localStorage.setItem("role", data.role);
                localStorage.setItem("status", data.status);
            }
        }
        catch (error) {
            console.error("Failed to refresh user data:", error);
        }
    };
    const signMessage = async (message) => {
        const isMobile = getIsMobile();
        const provider = isMobile && ethereumProvider ? ethereumProvider : window.ethereum;
        if (!provider)
            throw new Error("No wallet connected");
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        return await signer.signMessage(message);
    };
    return (<WalletContext.Provider value={{
            walletAddress,
            uid,
            role,
            status,
            isConnected: !!walletAddress,
            isConnecting,
            connect,
            disconnect,
            refreshUserData,
            signMessage,
        }}>
      {children}
    </WalletContext.Provider>);
}
export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within WalletProvider");
    }
    return context;
}
