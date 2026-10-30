import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type User = { id: string; email: string; name: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  recover: (email: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_KEY = "cartaz-economix-demo-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      if (localStorage.getItem(DEMO_KEY)) {
        setUser({ id: "preview", email: "team@economix.example", name: "Economix Team" });
      }
      setLoading(false);
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user;
      setUser(current ? { id: current.id, email: current.email ?? "", name: current.user_metadata.name ?? "Economix Team" } : null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user;
      setUser(current ? { id: current.id, email: current.email ?? "", name: current.user_metadata.name ?? "Economix Team" } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isDemo: !isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) {
        localStorage.setItem(DEMO_KEY, "1");
        setUser({ id: "preview", email: email || "team@economix.example", name: "Economix Team" });
        return null;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      localStorage.removeItem(DEMO_KEY);
      setUser(null);
    },
    recover: async (email) => {
      if (!supabase) return "No email is sent in private preview mode.";
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return error ? error.message : "Password reset instructions were sent to your email.";
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
