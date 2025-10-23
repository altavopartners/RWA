import { createClient } from "@supabase/supabase-js";

// Prefer environment variables; fallback to existing values to avoid breaking local usage.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lovable-sandbox-web-sandbox.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdmFibGUtc2FuZGJveC13ZWItc2FuZGJveCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM2MDU0NDM1LCJleHAiOjIwNTE2MzA0MzV9.UYqJFV_8PpJtUuGZfRi0zOCZ4TfkYHQCOYF4E1SQJ3E";

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY). Using fallback defaults; set proper env vars in production."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          name: string | null;
          email: string | null;
          business_name: string | null;
          location: string | null;
          description: string | null;
          avatar_url: string | null;
          role: "producer" | "buyer";
          verified: boolean;
          did: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          name?: string | null;
          email?: string | null;
          business_name?: string | null;
          location?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          role?: "producer" | "buyer";
          verified?: boolean;
          did?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          name?: string | null;
          email?: string | null;
          business_name?: string | null;
          location?: string | null;
          description?: string | null;
          avatar_url?: string | null;
          role?: "producer" | "buyer";
          verified?: boolean;
          did?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          image_url: string;
          certificate_url: string;
          token_id: string;
          price: number;
          quantity: number;
          status: "draft" | "listed" | "sold";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description: string;
          image_url: string;
          certificate_url: string;
          token_id: string;
          price: number;
          quantity: number;
          status?: "draft" | "listed" | "sold";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          image_url?: string;
          certificate_url?: string;
          token_id?: string;
          price?: number;
          quantity?: number;
          status?: "draft" | "listed" | "sold";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
