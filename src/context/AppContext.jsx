import { createContext, useContext, useState, useEffect } from "react";
import { loadSession, onAuthChange } from "../services/auth.service.js";
import { completeProfileFromInvite, getManagerBranches } from "../services/enterprise.service.js";
import { supabaseConfigError } from "../lib/supabase.js";

const AppContext = createContext(null);
const PENDING_INVITE_KEY = "vismo_pending_invite";

function readPendingInvite() {
  try {
    const raw = localStorage.getItem(PENDING_INVITE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [managerBranches, setManagerBranches] = useState([]);
  const [justConfirmedEmail, setJustConfirmedEmail] = useState(false);

  const refresh = async () => {
    if (supabaseConfigError) {
      setError(supabaseConfigError);
      setLoading(false);
      return;
    }
    try {
      let s = await loadSession();
      const pendingInvite = readPendingInvite();
      if (s?.profile && pendingInvite?.code && (!s.profile.company_id || s.profile.is_active === false)) {
        await completeProfileFromInvite(pendingInvite.code, {
          branchId: pendingInvite.branchId,
          branchIds: pendingInvite.branchIds,
          employeeId: pendingInvite.employeeId,
        });
        localStorage.removeItem(PENDING_INVITE_KEY);
        s = await loadSession();
      }
      setSession(s);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const { data: { subscription } } = onAuthChange(async (authSession, meta) => {
      if (meta?.justConfirmed) { setJustConfirmedEmail(true); setSession(null); setLoading(false); return; }
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

  useEffect(() => {
    if (role !== "area_manager" || !session?.profile?.id) { setManagerBranches([]); return; }
    getManagerBranches(session.profile.id).then(setManagerBranches).catch(() => setManagerBranches([]));
  }, [role, session?.profile?.id]);

  return (
    <AppContext.Provider value={{
      session, loading, error, refresh,
      supabaseConfigError,
      updateCategories, updateSettings,
      justConfirmedEmail, clearJustConfirmedEmail: () => setJustConfirmedEmail(false),
      // shortcuts
      profile:    session?.profile    ?? null,
      company:    session?.company    ?? null,
      settings:   session?.settings   ?? null,
      categories: session?.categories ?? [],
      branches:   session?.branches   ?? [],
      managerBranches,
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
