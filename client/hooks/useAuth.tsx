"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useToast } from "./use-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface User {
  id: string;
  walletAddress: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  businessName?: string | null;
  location?: string | null;
  businessDesc?: string | null;
  profileImage?: string | null;
  cartId?: string | null;
  role: "PRODUCER" | "BUYER" | "ADMIN" | "USER";
  did?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  token: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

// --------------------------- Wallet Helpers ---------------------------
const signMessageWithWallet = async (walletAddress: string, message: string) => {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }
  const signature: string = await window.ethereum.request({
    method: "personal_sign",
    params: [message, walletAddress],
  });
  return signature;
};

// --------------------------- Auth Provider ---------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  const [user, setUser] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  };

  // ------------------- Fetch profile from backend -------------------
  const fetchProfile = async (jwt: string) => {
    if (!jwt) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Failed to fetch profile: ${res.status} - ${errBody}`);
      }
      const data = await res.json();
      safeSetState(() => setUser(data.data));
    } catch (err) {
      console.error("Error fetching profile:", err);
      safeSetState(() => {
        setUser(null);
        setIsConnected(false);
      });
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("walletAddress");
    }
  };

  // ------------------- Check saved session -------------------
  const checkExistingSession = async () => {
    if (hasCheckedSession) return;

    const savedToken = localStorage.getItem("jwtToken");
    const savedAddress = localStorage.getItem("walletAddress");

    if (savedToken && savedAddress) {
      try {
        if (window.ethereum && window.ethereum.isMetaMask) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });

          if (
            accounts &&
            accounts.length > 0 &&
            accounts[0].toLowerCase() === savedAddress.toLowerCase()
          ) {
            safeSetState(() => {
              setWalletAddress(savedAddress);
              setToken(savedToken);
              setIsConnected(true);
              setHasCheckedSession(true);
            });

            // ✅ Only fetch profile if token exists
            await fetchProfile(savedToken);
          } else {
            console.log("Wallet mismatch, clearing session");
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("walletAddress");
            safeSetState(() => setHasCheckedSession(true));
          }
        } else {
          console.log("MetaMask not available, clearing session");
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("walletAddress");
          safeSetState(() => setHasCheckedSession(true));
        }
      } catch (err) {
        console.log("Error checking wallet, clearing session");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("walletAddress");
        safeSetState(() => setHasCheckedSession(true));
      }
    } else {
      safeSetState(() => setHasCheckedSession(true));
    }
  };

  useEffect(() => {
    checkExistingSession();
  }, []);

  // ------------------- Connect Wallet -------------------
  const connectWallet = async () => {
    safeSetState(() => setIsLoading(true));
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts || accounts.length === 0) throw new Error("No wallet accounts found");

      const address = accounts[0];
      safeSetState(() => setWalletAddress(address));

      // Get nonce from backend
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const nonceJson = await nonceRes.json();
      const nonce = nonceJson?.data?.nonce || `Sign this to login: ${Date.now()}`;

      // Sign nonce with wallet
      const signature = await signMessageWithWallet(address, nonce);

      // Connect wallet to backend
      const connectRes = await fetch(`${BACKEND_URL}/api/auth/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          signature,
          message: nonce,
          nonce,
          walletType: "METAMASK",
        }),
      });
      if (!connectRes.ok) throw new Error("Wallet connection failed");

      const { accessToken, user: userData } = await connectRes.json();

      safeSetState(() => {
        setToken(accessToken);
        setIsConnected(true);
        setUser(userData);
        setHasCheckedSession(true);
      });

      localStorage.setItem("jwtToken", accessToken);
      localStorage.setItem("walletAddress", address);

      // ✅ Fetch profile only now (after valid token)
      await fetchProfile(accessToken);

      toast({
        title: "Wallet connected",
        description: "Successfully connected your wallet!",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      toast({
        title: "Connection failed",
        description: err.message,
        variant: "destructive",
      });
      safeSetState(() => {
        setIsConnected(false);
        setWalletAddress(null);
        setToken(null);
      });
    } finally {
      safeSetState(() => setIsLoading(false));
    }
  };

  // ------------------- Disconnect Wallet -------------------
  const disconnectWallet = () => {
    safeSetState(() => {
      setUser(null);
      setWalletAddress(null);
      setToken(null);
      setIsConnected(false);
      setHasCheckedSession(false);
    });
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("jwtToken");
    toast({
      title: "Disconnected",
      description: "Wallet session cleared",
      variant: "default",
    });
  };

  // ------------------- Update Profile -------------------
  const updateProfile = async (data: Partial<User>) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      safeSetState(() => setUser(updated.data));
      toast({
        title: "Profile updated",
        description: "Your profile has been updated",
      });
    } catch (err: any) {
      console.error("Update profile error:", err);
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        walletAddress,
        isConnected,
        isLoading,
        token,
        connectWallet,
        disconnectWallet,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
