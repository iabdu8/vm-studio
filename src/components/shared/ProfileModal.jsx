import { useRef, useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { uploadAvatar } from "../../services/data.service.js";
import { toast } from "./Toast.jsx";

// Minimal per-user settings: change avatar photo, change password.
export function ProfileModal({ user, company, onClose, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const fileRef = useRef();

  const name = user?.full_name ?? "";
  const initials = name.split(" ").map(x => x[0]).join("").slice(0, 2);

  const pickPhoto = () => fileRef.current?.click();

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !company?.id || !user?.id) return;
    setUploading(true);
    try {
      await uploadAvatar(company.id, user.id, file);
      toast("Photo updated!", "success");
      onUpdated?.();
    } catch (err) {
      process.env?.NODE_ENV !== "production" && console.error(err);
      toast("Failed to upload photo.");
    } finally { setUploading(false); }
  };

  const savePassword = async () => {
    if (pw1.length < 6) return toast("Password must be at least 6 characters.");
    if (pw1 !== pw2) return toast("Passwords don't match.");
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      toast("Password updated!", "success");
      setPw1(""); setPw2("");
    } catch (err) {
      process.env?.NODE_ENV !== "production" && console.error(err);
      toast("Failed to update password.");
    } finally { setSavingPw(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#00000066", zIndex:499 }}/>
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        zIndex:500, width:"min(360px, 92vw)", background:"var(--clr-surface)",
        borderRadius:16, padding:22, border:`1px solid ${C.accentColor}22`,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={S.h3}>My Profile</div>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:C.mutedColor, fontSize:18, cursor:"pointer" }}>✕</button>
        </div>

        {/* Avatar */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:20 }}>
          <div onClick={pickPhoto} style={{
            width:76, height:76, borderRadius:"50%", cursor:"pointer", position:"relative",
            background: C.accentColor, display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden", border:`2px solid ${C.accentColor}55`,
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:24, fontWeight:700, color:"#0a0a0f" }}>{initials}</span>}
            <div style={{ position:"absolute", bottom:0, right:0, width:22, height:22, borderRadius:"50%",
              background:"var(--clr-surface)", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, border:`1px solid ${C.accentColor}44` }}>{uploading ? "…" : "📷"}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
          <button className="btnG" style={{ ...S.btnG, fontSize:12, marginTop:10, padding:"6px 14px" }}
            onClick={pickPhoto} disabled={uploading}>
            {uploading ? "Uploading…" : "Change Photo"}
          </button>
          <div style={{ fontSize:14, fontWeight:700, marginTop:10 }}>{name}</div>
          <div style={{ ...S.muted, fontSize:12 }}>{user?.role}</div>
        </div>

        {/* Password */}
        <div style={S.lbl}>New Password</div>
        <input style={S.inp} type="password" placeholder="At least 6 characters"
          value={pw1} onChange={e => setPw1(e.target.value)}/>
        <div style={S.lbl}>Confirm Password</div>
        <input style={S.inp} type="password" placeholder="Repeat password"
          value={pw2} onChange={e => setPw2(e.target.value)}/>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }}
          onClick={savePassword} disabled={savingPw || !pw1 || !pw2}>
          {savingPw ? "Saving…" : "Update Password"}
        </button>
      </div>
    </>
  );
}
