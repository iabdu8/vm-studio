import { S, C } from "../../styles/theme.js";
import { Avatar } from "./Atoms.jsx";
import { useApp } from "../../context/AppContext.jsx";

export function TopBar({ user, onLogout, isSuperAdmin, onSuperAdmin }) {
  const { company } = useApp();
  const name     = user?.full_name ?? user?.name ?? "";
  const initials = user?.avatar_initials ?? user?.avatar ?? name.split(" ").map(x=>x[0]).join("").slice(0,2);
  const branch   = user?.branch?.name ?? user?.branch ?? "";
  const logo     = company?.logo_url ?? null;
  const accent   = company?.accent_color ?? C.accentColor;

  return (
    <div style={S.topBar}>
      {/* Logo / App Name */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        {logo
          ? <img src={logo} alt={company?.name ?? ""}
              style={{ height:34, maxWidth:130, objectFit:"contain" }} />
          : <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:accent, letterSpacing:.5 }}>
              VM-Studio
            </div>
        }
      </div>

      {/* Right */}
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {isSuperAdmin && onSuperAdmin && (
          <button onClick={onSuperAdmin} style={{
            background:"#a855f722", border:"1px solid #a855f733", color:"#a855f7",
            padding:"4px 10px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700,
          }}>🛡️ Admin</button>
        )}
        <Avatar initials={initials} size={30} />
        <div>
          <div style={{ fontSize:12, fontWeight:600, lineHeight:1.2 }}>{name}</div>
          {branch && <div style={{ fontSize:10, color:C.mutedColor }}>{branch}</div>}
        </div>
        <span style={S.chip(user?.role)}>
          {user?.role === "manager" || user?.role === "super_admin" ? "MGR" : "VM"}
        </span>
        <button className="btnG" style={{ ...S.btnG, padding:"5px 12px", fontSize:12 }} onClick={onLogout}>
          Out
        </button>
      </div>
    </div>
  );
}