import { QueryClient } from "@tanstack/react-query";
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}
function getWalletAddress() {
    return localStorage.getItem("walletAddress");
}
export async function apiRequest(method, url, data) {
    const walletAddress = getWalletAddress();
    const headers = {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(walletAddress ? { "x-wallet-address": walletAddress } : {}),
    };
    const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
}
export const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
    const walletAddress = getWalletAddress();
    const headers = {
        ...(walletAddress ? { "x-wallet-address": walletAddress } : {}),
    };
    const res = await fetch(queryKey.join("/"), {
        credentials: "include",
        headers,
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
};
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
