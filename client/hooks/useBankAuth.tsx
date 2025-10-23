"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  bankLogin as bankLoginApi,
  bankLogout as bankLogoutApi,
} from "@/lib/bankAuth";

interface BankUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  bankId?: string;
}

interface BankAuthContextType {
  user: BankUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const BankAuthContext = createContext<BankAuthContextType | undefined>(
  undefined
);

export function BankAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BankUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in (e.g., from cookie/session)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch current bank user session from backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bank-auth/me`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response: any = await bankLoginApi({ email, password });

      // Assuming the API returns user data
      if (response.user) {
        setUser(response.user);
      } else {
        // Fetch user data after login
        const userResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/bank-auth/me`,
          {
            credentials: "include",
          }
        );
        if (userResponse.ok) {
          const data = await userResponse.json();
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await bankLogoutApi();
      setUser(null);
      router.push("/bank-auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear local state even if API call fails
      setUser(null);
      router.push("/bank-auth/login");
    }
  };

  return (
    <BankAuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </BankAuthContext.Provider>
  );
}

export function useBankAuth() {
  const context = useContext(BankAuthContext);
  if (context === undefined) {
    throw new Error("useBankAuth must be used within BankAuthProvider");
  }
  return context;
}
