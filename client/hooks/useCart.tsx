"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type FC,
} from "react";
import { addItemToCart, getCartCount, type AddItemPayload } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";

type CartContextValue = {
  count: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addItem: (
    payload: AddItemPayload
  ) => Promise<{ ok: boolean; message?: string }>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isConnected || !user?.id) {
      setCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const c = await getCartCount();
      setCount(Number.isFinite(c) ? c : 0);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, user?.id]);

  useEffect(() => {
    if (isConnected && user?.id) {
      refresh();
    } else {
      setCount(0);
    }
  }, [isConnected, user?.id, refresh]);

  const addItem = useCallback(
    async (payload: AddItemPayload) => {
      const res = await addItemToCart(payload, { useCookieAuth: true });
      if (res.success) {
        await refresh();
        return { ok: true, message: res.message };
      }
      return { ok: false, message: res.message };
    },
    [refresh]
  );

  return (
    <CartContext.Provider value={{ count, isLoading, refresh, addItem }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider />");
  return ctx;
}
