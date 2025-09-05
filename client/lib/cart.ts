// lib/cart.ts
export type AddItemPayload = {
  idofproduct: string | number;
  qty: number;
};

type AddItemResponse =
  | { success: true; cart?: any; message?: string }
  | { success: false; message: string; code?: string };

const API_BASE = "http://localhost:4000";

export async function addItemToCart(
  payload: AddItemPayload
): Promise<AddItemResponse> {
  try {
    // Grab token from localStorage (client-side only)
    const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

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
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Network error",
      code: "NETWORK_ERROR",
    };
  }
}
