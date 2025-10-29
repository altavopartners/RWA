"use client";

// hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useToast } from "./use-toast";

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
  _metamask?: {
    isUnlocked: () => Promise<boolean>;
  };
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface User {
  id: string;
  walletAddress: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null; // ✅ added
  businessName?: string | null;
  location?: string | null;
  businessDesc?: string | null;
  profileImage?: string | null;
  cartId?: string | null;
  role: "PRODUCER" | "BUYER" | "ADMIN" | "USER";
  // isVerified: boolean;in the back i meant by is verified that the user is connected and did generated not the kyc to avoid missunderstanding i removed it
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
const signMessageWithWallet = async (
  walletAddress: string,
  message: string
) => {
  if (!window.ethereum || !window.ethereum.isMetaMask) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }
  const signature = await window.ethereum.request({
    method: "personal_sign",
    params: [message, walletAddress],
  });
  return signature as string;
};

// Helper: Wait for MetaMask to be ready
const waitForMetaMask = async (timeout = 3000): Promise<boolean> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.ethereum) {
      // Give MetaMask a moment to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
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

  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  // ------------------- Fetch profile from backend -------------------
  const fetchProfile = useCallback(
    async (jwt: string, retries = 3, delay = 1000) => {
      if (!jwt) return;

      if (!BACKEND_URL) {
        console.error(
          "❌ NEXT_PUBLIC_API_URL is not defined in environment variables"
        );
        return;
      }

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const url = `${BACKEND_URL}/api/auth/profile`;
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${jwt}` },
          });

          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `❌ Failed to fetch profile (${res.status}):`,
              errorText
            );

            // Retry on 400/500 errors (likely database connection issues)
            if (
              (res.status === 400 || res.status >= 500) &&
              attempt < retries
            ) {
              console.log(
                `⏳ Retrying profile fetch (attempt ${attempt}/${retries}) in ${delay}ms...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }

            throw new Error(
              `Failed to fetch profile: ${res.status} ${res.statusText}`
            );
          }

          const data = await res.json();
          safeSetState(() => setUser(data.data));
          return; // Success, exit retry loop
        } catch (err) {
          if (attempt === retries) {
            // Final attempt failed
            console.error("❌ Error fetching profile after retries:", err);
            console.error("Backend URL:", BACKEND_URL);
            console.error("JWT token present:", !!jwt);

            safeSetState(() => {
              setUser(null);
              setIsConnected(false);
            });
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("walletAddress");
          } else {
            // Retry on error
            console.log(
              `⏳ Retrying profile fetch (attempt ${attempt}/${retries}) in ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    },
    [safeSetState, setUser, setIsConnected]
  );

  const checkExistingSession = useCallback(async () => {
    if (hasCheckedSession) return;

    const savedToken = localStorage.getItem("jwtToken");
    const savedAddress = localStorage.getItem("walletAddress");

    if (savedToken && savedAddress) {
      try {
        // First, wait for backend to be ready (health check)
        let backendReady = false;
        for (let i = 0; i < 5; i++) {
          try {
            const healthRes = await fetch(`${BACKEND_URL}/api/auth/health`, {
              signal: AbortSignal.timeout(2000),
            });
            if (healthRes.ok) {
              backendReady = true;
              console.log("✅ Backend is ready");
              break;
            }
          } catch {
            console.log(`⏳ Waiting for backend... (attempt ${i + 1}/5)`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        if (!backendReady) {
          console.warn(
            "⚠️  Backend not responding to health check, will retry on profile fetch"
          );
        }

        // Check if MetaMask is available and connected
        if (window.ethereum && window.ethereum.isMetaMask) {
          const accounts = (await window.ethereum.request({
            method: "eth_accounts",
          })) as string[];

          // Only proceed if wallet is connected and matches saved address
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

            // Now safely fetch profile since wallet is connected
            await fetchProfile(savedToken);
          } else {
            // Wallet not connected or address mismatch, clear session
            console.log(
              "Wallet not connected or address mismatch, clearing session"
            );
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("walletAddress");
            safeSetState(() => setHasCheckedSession(true));
          }
        } else {
          // MetaMask not available, clear session
          console.log("MetaMask not available, clearing session");
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("walletAddress");
          safeSetState(() => setHasCheckedSession(true));
        }
      } catch {
        // Error checking wallet connection, clear session
        console.log("Error checking wallet connection, clearing session");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("walletAddress");
        safeSetState(() => setHasCheckedSession(true));
      }
    } else {
      safeSetState(() => setHasCheckedSession(true));
    }
  }, [
    hasCheckedSession,
    fetchProfile,
    safeSetState,
    setWalletAddress,
    setToken,
    setIsConnected,
    setHasCheckedSession,
  ]);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  // ------------------- Connect Wallet -------------------
  const connectWallet = async () => {
    // Check existing session first without MetaMask interaction
    if (!hasCheckedSession) {
      await checkExistingSession();
      if (isConnected) return; // If session restored successfully, don't connect again
    }

    // Only proceed with MetaMask connection if no valid session exists
    safeSetState(() => setIsLoading(true));
    try {
      // Wait for MetaMask to be ready
      const metaMaskReady = await waitForMetaMask(3000);
      if (!metaMaskReady || !window.ethereum) {
        throw new Error(
          "MetaMask not found. Please install MetaMask and refresh the page."
        );
      }

      // First, try to get existing accounts without prompting
      let existingAccounts: string[] = [];
      try {
        existingAccounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];
        console.log("Existing MetaMask accounts:", existingAccounts.length);
      } catch (err) {
        console.log("Could not fetch existing accounts:", err);
      }

      // If no existing accounts, MetaMask is likely locked or not connected
      if (!existingAccounts || existingAccounts.length === 0) {
        console.log(
          "No existing accounts - MetaMask needs to be unlocked/connected"
        );

        // Check unlock status
        try {
          if (window.ethereum._metamask?.isUnlocked) {
            const isUnlocked = await window.ethereum._metamask.isUnlocked();
            console.log("MetaMask unlock status:", isUnlocked);

            if (!isUnlocked) {
              toast({
                title: "MetaMask is Locked",
                description:
                  "Please click the MetaMask extension icon and unlock it, then try connecting again.",
                variant: "default",
                duration: 8000,
              });
              throw new Error(
                "MetaMask is locked. Please unlock MetaMask and try again."
              );
            }
          }
        } catch (unlockCheckError) {
          console.log(
            "Could not check MetaMask lock status:",
            unlockCheckError
          );
        }

        // Show instruction before making the request
        toast({
          title: "Connecting to MetaMask",
          description:
            "A MetaMask popup should appear. If not, click the MetaMask extension icon.",
          variant: "default",
          duration: 5000,
        });
      }

      // Request accounts with shorter timeout to prevent indefinite hanging
      console.log("Requesting MetaMask accounts...");

      const accountsPromise = window.ethereum.request({
        method: "eth_requestAccounts",
      }) as Promise<string[]>;

      // Add a shorter timeout wrapper (15 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "MetaMask did not respond. Please:\n1. Click the MetaMask extension icon\n2. Unlock your wallet\n3. Try connecting again"
            )
          );
        }, 15000); // 15 second timeout
      });

      const accounts = await Promise.race([accountsPromise, timeoutPromise]);

      if (!accounts || accounts.length === 0) {
        throw new Error(
          "No wallet accounts found. Please unlock MetaMask and approve the connection request."
        );
      }

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
      const nonce =
        nonceJson?.data?.nonce || `Sign this to login: ${Date.now()}`;

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

      toast({
        title: "Wallet connected",
        description: "Successfully connected your wallet!",
        variant: "default",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      console.error("Wallet connection error:", err);

      // Provide more helpful error messages
      let userMessage = message;
      if (message.includes("timeout")) {
        userMessage =
          "Connection timeout. Please open MetaMask extension, unlock it, and try again.";
      } else if (message.includes("User rejected")) {
        userMessage = "Connection cancelled. Please try again when ready.";
      }

      toast({
        title: "Connection failed",
        description: userMessage,
        variant: "destructive",
        duration: 7000,
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
      setHasCheckedSession(false); // Reset session check state
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
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      console.error("Update profile error:", err);
      toast({
        title: "Update failed",
        description: message,
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
