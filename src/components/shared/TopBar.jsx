import { useTheme } from "../../context/ThemeContext.jsx";
import { S, C } from "../../styles/theme.js";
import { useApp } from "../../context/AppContext.jsx";

export function TopBar({ user, onLogout, isSuperAdmin, onSuperAdmin }) {
  const { company } = useApp();
  const { mode, toggle } = useTheme();

  const name     = user?.full_name ?? user?.name ?? "";
  const initials = name.split(" ").map(x=>x[0]).join("").slice(0,2);
  const branch   = user?.branch?.name ?? user?.branch ?? "";
  const logo     = company?.logo_url ?? null;

  return (
    <div style={S.topBar}>
      {/* Logo / Name */}
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
        <button onClick={toggle} title={mode==="dark"?"Switch to Light":"Switch to Dark"}
          style={{ background:"none", border:"1px solid color-mix(in srgb,var(--clr-accent) 33%,transparent)",
            borderRadius:8, cursor:"pointer", fontSize:16, padding:"4px 8px", lineHeight:1,
            color:C.accentColor, transition:"all .2s" }}>
          {mode === "dark" ? "☀️" : "🌙"}
        </button>

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
  );
}