import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { S, C } from "../../styles/theme.js";
import { useApp } from "../../context/AppContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { NotificationBell, NotificationPanel } from "./NotificationCenter.jsx";

export function TopBar({ user, onLogout, isSuperAdmin, onSuperAdmin }) {
  const { company } = useApp();
  const { mode, toggle } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const name     = user?.full_name ?? user?.name ?? "";
  const initials = name.split(" ").map(x=>x[0]).join("").slice(0,2);
  const branch   = user?.branch?.name ?? user?.branch ?? "";
  const logo     = company?.logo_url ?? null;

  useEffect(() => {
    if (!user?.id) return;
    // Load unread count
    supabase.from("notifications")
      .select("id", { count:"exact" })
      .eq("user_id", user.id).eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));

    // Real-time unread count
    const sub = supabase
      .channel(`notif-count-${user.id}`)
      .on("postgres_changes", {
        event:"INSERT", schema:"public", table:"notifications",
        filter:`user_id=eq.${user.id}`,
      }, () => setUnreadCount(p => p + 1))
      .subscribe();

    return () => sub.unsubscribe();
  }, [user?.id]);

  return (
    <>
      <div style={S.topBar}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {logo
            ? <img src={logo} alt={company?.name ?? ""} style={{ height:34, maxWidth:130, objectFit:"contain" }} />
            : <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor, letterSpacing:.5 }}>
                VM-Studio
              </div>
          }
        </div>

        {/* Right */}
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* Theme toggle */}
          <button onClick={toggle} title={mode==="dark"?"Light Mode":"Dark Mode"}
            style={{ background:"none", border:"1px solid color-mix(in srgb,var(--clr-accent) 33%,transparent)",
              borderRadius:8, cursor:"pointer", fontSize:16, padding:"4px 8px", lineHeight:1,
              color:C.accentColor, transition:"all .2s" }}>
            {mode === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Notification bell */}
          <NotificationBell
            userId={user?.id}
            count={unreadCount}
            onClick={() => { setShowNotifs(true); setUnreadCount(0); }}
          />

          {isSuperAdmin && onSuperAdmin && (
            <button onClick={onSuperAdmin} style={{
              background:"#a855f722", border:"1px solid #a855f733", color:"#a855f7",
              padding:"4px 10px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700,
            }}>🛡️</button>
          )}

          <div style={S.avatar(30)}>{initials}</div>

          <div>
            <div style={{ fontSize:12, fontWeight:600, lineHeight:1.2 }}>{name}</div>
            {branch && <div style={{ fontSize:10, color:C.mutedColor }}>{branch}</div>}
          </div>

          <span style={S.chip(user?.role)}>
            {user?.role === "manager" ? "MGR" : user?.role === "area_manager" ? "AM" : user?.role === "store_manager" ? "SM" : "VM"}
          </span>

          <button className="btnG" style={{ ...S.btnG, padding:"5px 12px", fontSize:12 }} onClick={onLogout}>
            Out
          </button>
        </div>
      </div>

      {/* Notification panel overlay */}
      {showNotifs && (
        <>
          <div onClick={() => setShowNotifs(false)} style={{
            position:"fixed", inset:0, background:"#00000044", zIndex:499,
          }}/>
          <NotificationPanel
            userId={user?.id}
            companyId={company?.id}
            onClose={() => setShowNotifs(false)}
          />
        </>
      )}
    </>
  );
}