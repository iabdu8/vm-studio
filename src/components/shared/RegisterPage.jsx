import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import { S, C } from "../../styles/theme.js";
import { StyleTag } from "./Atoms.jsx";
import { Logo } from "./Logo.jsx";
import { lookupCompanyByCode, lookupActiveBranches, lookupRegions, lookupBranchesByRegion, setManagerBranches } from "../../services/enterprise.service.js";

export function RegisterPage({ onBack }) {
  const [step,     setStep]     = useState(1);
  const [code,     setCode]     = useState("");
  const [company,  setCompany]  = useState(null);
  const [role,     setRole]     = useState("vm");
  const [name,     setName]     = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [regions,  setRegions]  = useState([]);              // VM Manager — regions available in this company
  const [selectedRegions, setSelectedRegions] = useState([]); // VM Manager — region(s) they picked, e.g. West + South
  const [pickedBranchIds, setPickedBranchIds] = useState([]); // VM Manager — one or more branches in those regions
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);
  const [done,     setDone]     = useState(false);

  const verifyCode = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr("");
    try {
      const upperCode = code.trim().toUpperCase();
      const companyMatch = await lookupCompanyByCode(upperCode);
      if (companyMatch) {
        setCompany(companyMatch); setRole(companyMatch.role);
        if (companyMatch.role === "area_manager") {
          const regionList = await lookupRegions(companyMatch.id);
          setRegions(regionList);
          setSelectedRegions([]); setBranches([]); setPickedBranchIds([]);
        } else if (companyMatch.role === "manager") {
          // Head VM is company-wide — no branch to pick
          setBranches([]);
        } else {
          const branchData = await lookupActiveBranches(companyMatch.id);
          setBranches(branchData);
          if (branchData.length === 1) setBranchId(branchData[0].id);
        }
        setStep(2); return;
      }
      setErr("Invalid invite code. Please check with your manager.");
    } finally { setLoading(false); }
  };

  const toggleRegion = async (r) => {
    const next = selectedRegions.includes(r) ? selectedRegions.filter(x => x !== r) : [...selectedRegions, r];
    setSelectedRegions(next);
    setPickedBranchIds([]);
    if (!next.length) { setBranches([]); return; }
    setRegionLoading(true);
    try { setBranches(await lookupBranchesByRegion(company.id, next.join(","))); }
    finally { setRegionLoading(false); }
  };

  const register = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) { setErr("Please fill in all fields."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (role === "area_manager" && (!selectedRegions.length || pickedBranchIds.length === 0)) { setErr("Pick your region(s) and at least one branch you manage."); return; }
    if (role !== "area_manager" && branches.length > 0 && !branchId) { setErr("Please select your branch."); return; }
    setLoading(true); setErr("");
    try {
      // area_manager isn't tied to a single branch — their scope lives in manager_branches
      const signupBranchId = role === "area_manager" ? null : (branchId || null);
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(), password: password.trim(),
        options: { data: { full_name: name.trim(), role, company_id: company.id, branch_id: signupBranchId } },
      });
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create account.");

      if (role === "area_manager") await setManagerBranches(userId, pickedBranchIds);

      if (employeeId.trim()) {
        await supabase.from("profiles").update({ employee_id: employeeId.trim() }).eq("id", userId);
      }

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
          You joined <strong style={{ color:C.accentColor }}>{company?.name}</strong> as{" "}
          <strong style={{ color:"#818cf8" }}>Visual Merchandiser</strong>
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
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
          <Logo size="lg" />
          <div style={{ ...S.muted, fontSize:12, marginTop:10, textAlign:"center" }}>Create your account</div>
        </div>

        {/* Steps */}
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:24 }}>
          {[1,2].map(n => (
            <div key={n} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background: step>=n ? C.accentColor : C.surfaceHigh,
                color: step>=n ? "#fff" : C.mutedColor,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</div>
              <span style={{ fontSize:12, color: step>=n ? C.textColor : C.mutedColor }}>
                {n===1 ? "Invite Code" : "Your Details"}
              </span>
              {n<2 && <div style={{ width:20, height:1, background:C.mutedColor+"44" }}/>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <div style={{ ...S.muted, fontSize:13, marginBottom:20, lineHeight:1.6 }}>
              Enter the invite code from your manager to join your company workspace.
            </div>
            <div style={S.lbl}>Invite Code</div>
            <input
              style={{ ...S.inp, textTransform:"uppercase", letterSpacing:4, fontSize:18, textAlign:"center" }}
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setErr(""); }}
              onKeyDown={e => e.key==="Enter" && verifyCode()}
              placeholder="e.g. HC2026"
            />
            {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={verifyCode} disabled={loading}>
              {loading ? "Checking…" : "Verify Code →"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20,
              padding:"10px 14px", background:C.accentColor+"18",
              border:`1px solid ${C.accentColor}33`, borderRadius:10 }}>
              {company?.logo_url
                ? <img loading="lazy" src={company.logo_url} alt={company.name} style={{ height:32, objectFit:"contain", flexShrink:0 }}/>
                : <div style={{ width:32, height:32, borderRadius:8, background:company?.accent_color??C.accentColor, flexShrink:0 }}/>
              }
              <div>
                <div style={{ fontSize:12, fontWeight:700 }}>{company?.name}</div>
                <div style={{ fontSize:11, color:
                  role==="manager" ? "#4F46E5" :
                  role==="area_manager" ? "#a855f7" :
                  role==="store_manager" ? "#4F46E5" : "#818cf8" }}>
                  {role==="manager" ? "🏢 Head VM" :
                   role==="area_manager" ? "👔 VM Manager" :
                   role==="store_manager" ? "⚡ VM Controller" : "✅ VM Staff"}
                </div>
              </div>
            </div>

            {role === "area_manager" ? (
              <>
                <div style={S.lbl}>Your Region(s) — pick more than one if you cover several</div>
                {regions.length > 0 ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                    {regions.map(r => {
                      const picked = selectedRegions.includes(r);
                      return (
                        <button key={r} type="button" onClick={() => toggleRegion(r)}
                          style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                            background: picked ? C.accentColor+"28" : "transparent",
                            color: picked ? C.accentColor : C.mutedColor,
                            border: picked ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}33` }}>
                          {picked ? "✓ " : ""}{r}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:C.mutedColor, marginBottom:12 }}>No regions set up yet — ask your admin.</div>
                )}

                {selectedRegions.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={S.lbl}>Which branch(es) in {selectedRegions.join(" + ")} do you manage?</div>
                    {regionLoading ? (
                      <div style={{ fontSize:12, color:C.mutedColor }}>Loading branches…</div>
                    ) : (
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {branches.map(b => {
                          const picked = pickedBranchIds.includes(b.id);
                          return (
                            <button key={b.id} type="button"
                              onClick={() => setPickedBranchIds(p => picked ? p.filter(x => x !== b.id) : [...p, b.id])}
                              style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                                background: picked ? C.accentColor+"28" : "transparent",
                                color: picked ? C.accentColor : C.mutedColor,
                                border: picked ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}33` }}>
                              {picked ? "✓ " : "📍 "}{b.name}
                            </button>
                          );
                        })}
                        {branches.length === 0 && (
                          <div style={{ fontSize:12, color:C.mutedColor }}>No branches in this region yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : branches.length > 0 && (
              <>
                <div style={S.lbl}>Branch</div>
                <select style={S.sel} value={branchId} onChange={e => setBranchId(e.target.value)}>
                  <option value="">— Select your branch —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}
            <div style={S.lbl}>Full Name</div>
            <input style={S.inp} placeholder="Your full name" value={name}
              onChange={e => { setName(e.target.value); setErr(""); }}/>
            <div style={S.lbl}>Employee ID</div>
            <input style={S.inp} placeholder="e.g. 10234" value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}/>
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
              onClick={() => { setStep(1); setErr(""); }}>
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
