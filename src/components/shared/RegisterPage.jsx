import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { S, C } from "../../styles/theme.js";
import { StyleTag } from "./Atoms.jsx";

export function RegisterPage({ onBack }) {
  const [step,     setStep]     = useState(1);
  const [code,     setCode]     = useState("");
  const [company,  setCompany]  = useState(null);
  const [role,     setRole]     = useState("vm");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const verifyCode = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr("");
    try {
      const upperCode = code.trim().toUpperCase();
      const { data: vmData } = await supabase
        .from("companies")
        .select("id, name, logo_url, accent_color")
        .eq("invite_code", upperCode)
        .single();
      if (vmData) { setCompany(vmData); setRole("vm"); setStep(2); return; }
      const { data: mgrData } = await supabase
        .from("companies")
        .select("id, name, logo_url, accent_color")
        .eq("manager_invite_code", upperCode)
        .single();
      if (mgrData) { setCompany(mgrData); setRole("manager"); setStep(2); return; }
      setErr("Invalid invite code. Please check with your manager.");
    } finally { setLoading(false); }
  };

  const register = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setErr("Please fill in all fields."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading(true); setErr("");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(), password: password.trim(),
        options: { data: { full_name: name.trim(), role, company_id: company.id } },
      });
      if (authErr) throw authErr;
      if (!authData.user?.id) throw new Error("Failed to create account.");
      setDone(true);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div style={S.loginBg}>
      <StyleTag />
      <div style={{ ...S.loginCard, textAlign:"center" }} className="fu">
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ ...S.dFont, fontSize:24, fontWeight:700, color:C.accentColor, marginBottom:8 }}>Account Created!</div>
        <div style={{ ...S.muted, marginBottom:8 }}>
          You joined as <strong style={{ color: role==="manager"?"#c8a96e":"#818cf8" }}>
            {role === "manager" ? "Manager" : "Visual Merchandiser"}
          </strong>
        </div>
        <div style={{ ...S.muted, marginBottom:24, fontSize:12 }}>Check your email to confirm, then sign in.</div>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={onBack}>Back to Sign In →</button>
      </div>
    </div>
  );

  return (
    <div style={S.loginBg}>
      <StyleTag />
      <div style={S.loginCard} className="fu">
        <div style={{ ...S.dFont, fontSize:32, fontWeight:700, color:C.accentColor, lineHeight:1, marginBottom:4 }}>VM-Studio</div>
        <div style={{ ...S.muted, fontSize:12, marginBottom:28 }}>Create your account</div>

        {/* Steps */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:24 }}>
          {[1,2].map(n => (
            <div key={n} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background: step>=n ? C.accentColor : C.surfaceHigh,
                color: step>=n ? "#0a0a0f" : C.mutedColor,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
              <span style={{ fontSize:12, color: step>=n ? C.textColor : C.mutedColor }}>
                {n===1 ? "Invite Code" : "Your Details"}
              </span>
              {n<2 && <div style={{ width:20, height:1, background:C.mutedColor+"44" }}/>}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div style={{ ...S.muted, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
              Enter the invite code from your manager to join your company workspace.
            </div>
            <div style={S.lbl}>Invite Code</div>
            <input
              style={{ ...S.inp, textTransform:"uppercase", letterSpacing:2, fontSize:15, textAlign:"center" }}
              value={code}
              onChange={e => { setCode(e.target.value); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && verifyCode()}
            />
            {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={verifyCode} disabled={loading}>
              {loading ? "Checking…" : "Verify Code →"}
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20,
              padding:"10px 14px", background:C.accentColor+"18",
              border:`1px solid ${C.accentColor}33`, borderRadius:10 }}>
              {company?.logo_url
                ? <img src={company.logo_url} alt={company.name} style={{ height:32, objectFit:"contain", flexShrink:0 }}/>
                : <div style={{ width:32, height:32, borderRadius:8, background:company?.accent_color??C.accentColor, flexShrink:0 }}/>
              }
              <div>
                <div style={{ fontSize:12, fontWeight:700 }}>{company?.name}</div>
                <div style={{ fontSize:11, color: role==="manager"?"#c8a96e":"#818cf8" }}>
                  {role==="manager" ? "👔 Manager" : "✅ Visual Merchandiser"}
                </div>
              </div>
            </div>

            <div style={S.lbl}>Full Name</div>
            <input style={S.inp} placeholder="Your full name" value={name}
              onChange={e => { setName(e.target.value); setErr(""); }}/>
            <div style={S.lbl}>Email</div>
            <input style={S.inp} type="email" placeholder="your@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setErr(""); }}/>
            <div style={S.lbl}>Password</div>
            <input style={S.inp} type="password" placeholder="Min. 6 characters" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key==="Enter" && register()}/>

            {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%", marginBottom:10 }}
              onClick={register} disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
            <button className="btnG" style={{ ...S.btnG, width:"100%", fontSize:12 }}
              onClick={() => { setStep(1); setErr(""); setRole("vm"); }}>
              ← Change Code
            </button>
          </>
        )}

        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:C.mutedColor,
            cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}