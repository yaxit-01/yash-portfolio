import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { AUTHORIZED_ADMIN_EMAIL } from "./authConstants";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(isSupabaseConfigured && supabase));
  const [authError, setAuthError] = useState(null);

  const isAdmin = Boolean(user && user.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase());

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);

    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Please check your .env.local file.");
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`Access restricted: ${email} is not authorized to access this dashboard.`);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    if (data.user?.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      throw new Error("Access denied: Not an authorized administrator.");
    }

    setUser(data.user);
    setSession(data.session);
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        loading,
        authError,
        login,
        logout,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

