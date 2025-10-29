// lib/cart.ts
export type AddItemPayload = {
  idofproduct: string | number;
  qty: number;
};

type AddItemResponse =
  | {
      success: true;
      cart?: { id: string; [key: string]: unknown };
      message?: string;
    }
  | { success: false; message: string; code?: string };

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export async function addItemToCart(
  payload: AddItemPayload
): Promise<AddItemResponse> {
  try {
    // Grab token from localStorage (client-side only)
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/carts/additemtocart`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data?.message ?? `Error ${res.status}`,
        code: String(res.status),
      };
    }

    return {
      success: true,
      cart: data?.cart ?? data,
      message: data?.message ?? "Item added to cart",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error",
      code: "NETWORK_ERROR",
    };
  }
}

// ===== AJOUTS =====

// Récupère uniquement le nombre total d'articles du panier
export async function getCartCount(): Promise<number> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/carts/getmycart`, {
      method: "GET",
      headers,
    });

    if (!res.ok) return 0;

    const data = await res.json().catch(() => ({}));
    return Number(data?.count ?? 0);
  } catch {
    return 0;
  }
}

// Récupère tout le panier complet (si tu veux l'utiliser ailleurs)
export async function getMyCart(): Promise<{
  id: string;
  items?: unknown[];
  [key: string]: unknown;
} | null> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/carts/getmycart`, {
      method: "GET",
      headers,
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
