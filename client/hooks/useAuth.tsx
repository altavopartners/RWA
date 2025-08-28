// hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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
  businessName?: string | null;
  location?: string | null;
  description?: string | null;
  profileImage?: string | null;
  role: "PRODUCER" | "BUYER" | "ADMIN";
  isVerified: boolean;
  did?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

// --------------------------- Wallet Helpers ---------------------------
const signMessageWithWallet = async (
  walletAddress: string,
  message: string
) => {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  // Returns a string, not an array
  const signature: string = await window.ethereum.request({
    method: "personal_sign",
    params: [message, walletAddress],
  });

  return signature;
};

// --------------------------- Auth Provider ---------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Restore session
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    const savedToken = localStorage.getItem("jwtToken");
    if (savedAddress && savedToken) {
      setWalletAddress(savedAddress);
      setToken(savedToken);
      setIsConnected(true);
      fetchProfile(savedToken);
    }
  }, []);

  const fetchProfile = async (jwt: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data.data);
    } catch (err) {
      console.error(err);
      setUser(null);
      setIsConnected(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      // Step 1: Request accounts
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet accounts found");
      }
      const address = accounts[0];
      setWalletAddress(address);

      // Step 2: Get nonce
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const nonceJson = await nonceRes.json();
      const nonce =
        nonceJson?.data?.nonce || `Sign this to login: ${Date.now()}`;

      // Step 3: Sign
      const signature = await signMessageWithWallet(address, nonce);

      // Step 4: Verify with backend
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
      const { accessToken, user: userData } = await connectRes.json(); // <-- correct destructure
      const jwt = accessToken;

      // Step 5: Save session
      setToken(jwt);
      localStorage.setItem("jwtToken", jwt);
      localStorage.setItem("walletAddress", address);
      setIsConnected(true);
      setUser(userData);

      toast({
        title: "Wallet connected",
        description: "Successfully connected your wallet!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Connection failed",
        description: err.message,
        variant: "destructive",
      });
      setIsConnected(false);
      setWalletAddress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setUser(null);
    setWalletAddress(null);
    setToken(null);
    setIsConnected(false);
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("jwtToken");
    toast({ title: "Disconnected", description: "Wallet session cleared" });
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/progressive`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setUser(updated.data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated",
      });
    } catch (err: any) {
      console.error(err);
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
        connectWallet,
        disconnectWallet,
        updateProfile,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
