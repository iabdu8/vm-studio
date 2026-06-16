import { createContext, useContext, useState, useEffect } from "react";
import { loadSession, onAuthChange } from "../services/auth.service.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = async () => {
    try {
      const s = await loadSession();
      setSession(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const { data: { subscription } } = onAuthChange(async (authSession) => {
      if (authSession) { await refresh(); }
      else { setSession(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const updateCategories = (cats) =>
    setSession(s => s ? { ...s, categories: cats } : s);
  const updateSettings = (settings) =>
    setSession(s => s ? { ...s, settings } : s);

  const role = session?.profile?.role ?? null;

  return (
    <AppContext.Provider value={{
      session, loading, error, refresh,
      updateCategories, updateSettings,
      // shortcuts
      profile:    session?.profile    ?? null,
      company:    session?.company    ?? null,
      settings:   session?.settings   ?? null,
      categories: session?.categories ?? [],
      branches:   session?.branches   ?? [],
      // role flags
      isVM:           role === "vm",
      isStoreManager: role === "store_manager",
      isAreaManager:  role === "area_manager",
      isManager:      ["manager","super_admin"].includes(role),
      isVMManager:    role === "manager",
      isSuperAdmin:   role === "super_admin",
      // any manager-level access
      isAnyManager:   ["manager","area_manager","store_manager","super_admin"].includes(role),
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