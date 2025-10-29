"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";

interface WalletConnectContextType {
  showConnectModal: boolean;
  triggerConnect: () => void;
  hideConnect: () => void;
  requireAuth: (action: () => void | Promise<void>) => Promise<void>;
}

const WalletConnectContext = createContext<
  WalletConnectContextType | undefined
>(undefined);

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const { isConnected } = useAuth();

  const triggerConnect = useCallback(() => {
    if (!isConnected) {
      setShowConnectModal(true);
    }
  }, [isConnected]);

  const hideConnect = useCallback(() => {
    setShowConnectModal(false);
  }, []);

  const requireAuth = useCallback(
    async (action: () => void | Promise<void>) => {
      if (!isConnected) {
        setShowConnectModal(true);
        return;
      }
      await action();
    },
    [isConnected]
  );

  return (
    <WalletConnectContext.Provider
      value={{
        showConnectModal,
        triggerConnect,
        hideConnect,
        requireAuth,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error(
      "useWalletConnect must be used within a WalletConnectProvider"
    );
  }
  return context;
}
