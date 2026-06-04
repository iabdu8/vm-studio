import { createContext, useContext, useState, useEffect } from "react";
import { loadSession, onAuthChange } from "../services/auth.service.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session,  setSession]  = useState(null);   // { profile, company, settings, categories, branches }
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

 const refresh = async () => {
    try {
      console.log("loading session...");
      const s = await loadSession();
      console.log("session loaded:", s);
      setSession(s);
    } catch (e) {
      console.error("session error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const { data: { subscription } } = onAuthChange(async (authSession) => {
      if (authSession) {
        await refresh();
      } else {
        setSession(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Helpers to update local state after mutations
  const updateCategories = (cats) =>
    setSession(s => s ? { ...s, categories: cats } : s);

  const updateSettings = (settings) =>
    setSession(s => s ? { ...s, settings } : s);

  return (
    <AppContext.Provider value={{
      session,
      loading,
      error,
      refresh,
      updateCategories,
      updateSettings,
      // shortcuts
      profile:    session?.profile    ?? null,
      company:    session?.company    ?? null,
      settings:   session?.settings   ?? null,
      categories: session?.categories ?? [],
      branches:   session?.branches   ?? [],
      isVM:       session?.profile?.role === "vm",
      isManager:  ["manager","super_admin"].includes(session?.profile?.role),
      isSuperAdmin: session?.profile?.role === "super_admin",
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
