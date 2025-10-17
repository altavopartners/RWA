// client/lib/bankAuth.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

async function safeFetch<T>(
  path: string,
  options: RequestInit & { method?: string } = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include",
      mode: "cors",
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && data.message) ||
        `HTTP ${res.status} ${res.statusText}`;
      console.log("❌ [bankAuth] Request failed", { url, status: res.status, body: data });
      throw new Error(`${msg} — ${url}`);
    }

    console.info("✅ [bankAuth] Success", { url, status: res.status });
    return (data as T) ?? ({} as T);
  } catch (err: any) {
    // This is where connection refused, DNS, or CORS shows up
    const hint =
      err?.message?.includes("Failed to fetch") || err?.name === "TypeError"
        ? "Connection refused or CORS blocked"
        : "Network error";
    console.log("💥 [bankAuth] Network error", { url, error: err, hint });
    throw new Error(`${hint}: ${url} — ${err?.message || "unknown error"}`);
  }
}

export async function bankRegister(payload: {
  email: string; password: string; name?: string; phone?: string; bankId?: string;
}) {
  return safeFetch("/api/bank-auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bankLogin(payload: { email: string; password: string }) {
  return safeFetch("/api/bank-auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bankLogout() {
  return safeFetch("/api/bank-auth/logout", { method: "GET" });
}
