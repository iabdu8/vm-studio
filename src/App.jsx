import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext.jsx";
import { signIn, signOut } from "./services/auth.service.js";
import {
  getTasks, createTask, updateTask, deleteTask,
  getSubmissions, createSubmission, reviewSubmission,
  getGuidelines, uploadGuideline,
  getChatMessages, sendMessage, subscribeToChat,
  getActivityLog, logActivity,
} from "./services/data.service.js";
import { supabase } from "./lib/supabase.js";
import { useOfflineSync } from "./hooks/useOfflineSync.js";
import { exportWeeklyReport } from "./lib/pdfExport.js";
import { subscribeToPush } from "./lib/notifications.js";
import { StyleTag }           from "./components/shared/Atoms.jsx";
import { TopBar }             from "./components/shared/TopBar.jsx";
import { VMNav, MgrNav }      from "./components/shared/BottomNav.jsx";
import { LoginPage }          from "./components/shared/LoginPage.jsx";
import { RegisterPage }       from "./components/shared/RegisterPage.jsx";
import { Chat }               from "./components/shared/Chat.jsx";
import { VMGuidelines }       from "./components/shared/Guidelines.jsx";
import { StatusBar }          from "./components/shared/StatusBar.jsx";
import { VMHome }             from "./components/vm/VMHome.jsx";
import { VMTasks }            from "./components/vm/VMTasks.jsx";
import { MgrOverview }        from "./components/manager/MgrOverview.jsx";
import { MgrRequests }        from "./components/manager/MgrRequests.jsx";
import { MgrAssign }          from "./components/manager/MgrAssign.jsx";
import { MgrReports }         from "./components/manager/MgrReports.jsx";
import { AnalyticsDashboard } from "./components/manager/Analytics.jsx";
import { SuperAdminPanel }    from "./components/superadmin/SuperAdminPanel.jsx";
import { S, C }               from "./styles/theme.js";
import { nowTime }            from "./utils.js";

// ── Loading ───────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ ...S.loginBg, flexDirection:"column", gap:16 }}>
      <StyleTag />
      <div style={{ ...S.dFont, fontSize:32, color:C.accentColor }}>VM-Studio</div>
      <div style={{ color:C.mutedColor, fontSize:13 }}>Loading…</div>
    </div>
  );
}

// ── Forgot Password ───────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!email.trim()) return;
    setLoading(true); setErr("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div style={S.loginBg}>
      <StyleTag />
      <div style={{ ...S.loginCard, textAlign:"center" }} className="fu">
        <div style={{ fontSize:44, marginBottom:16 }}>📧</div>
        <div style={{ ...S.dFont, fontSize:22, fontWeight:700, color:C.accentColor, marginBottom:8 }}>
          Check your email
        </div>
        <div style={{ ...S.muted, marginBottom:24, lineHeight:1.7 }}>
          We sent a password reset link to <strong style={{ color:C.textColor }}>{email}</strong>.
          Open it on this device.
        </div>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={onBack}>
          Back to Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.loginBg}>
      <StyleTag />
      <div style={S.loginCard} className="fu">
        <div style={{ ...S.dFont, fontSize:32, fontWeight:700, color:C.accentColor, lineHeight:1, marginBottom:4 }}>
          Reset Password
        </div>
        <div style={{ ...S.muted, fontSize:12, marginBottom:28, lineHeight:1.6 }}>
          Enter your email and we'll send you a reset link.
        </div>
        <div style={S.lbl}>Email</div>
        <input style={S.inp} type="email" placeholder="your@email.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && send()} />
        {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
        <button className="btnP" style={{ ...S.btnP, width:"100%", marginBottom:10 }}
          onClick={send} disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link →"}
        </button>
        <button onClick={onBack} style={{
          background:"none", border:"none", color:C.mutedColor,
          cursor:"pointer", fontSize:12, width:"100%", textAlign:"center",
          fontFamily:"'DM Sans',sans-serif",
        }}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────
function LoginScreen() {
  const [view,     setView]     = useState("login"); // login | register | forgot
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);

  const go = async () => {
    if (!email || !password) return;
    setLoading(true); setErr("");
    try { await signIn(email, password); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  if (view === "register") return <RegisterPage onBack={() => setView("login")} />;
  if (view === "forgot")   return <ForgotPassword onBack={() => setView("login")} />;

  return (
    <div style={S.loginBg}>
      <StyleTag />
      <div style={S.loginCard} className="fu">
        <div style={{ ...S.dFont, fontSize:38, fontWeight:700, color:C.accentColor, lineHeight:1, marginBottom:6 }}>
          VM-Studio
        </div>
        <div style={{ ...S.muted, fontSize:12, letterSpacing:.5, marginBottom:32 }}>
          Visual Merchandising Operations Platform
        </div>

        <div style={S.lbl}>Email</div>
        <input style={S.inp} type="email" placeholder="Email address"
          value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && go()} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={S.lbl}>Password</div>
          <button onClick={() => setView("forgot")} style={{
            background:"none", border:"none", color:C.mutedColor,
            cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif",
            padding:0, marginBottom:4,
          }}>
            Forgot password?
          </button>
        </div>
        <input style={S.inp} type="password" placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && go()} />

        {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}

        <button className="btnP"
          style={{ ...S.btnP, width:"100%", padding:"13px", fontSize:14 }}
          onClick={go} disabled={loading}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ textAlign:"center", marginTop:16 }}>
          <button onClick={() => setView("register")} style={{
            background:"none", border:"none", color:C.mutedColor,
            cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif",
          }}>
            New employee? Create account
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Super Admin ───────────────────────────────────────────────
function SuperAdminApp() {
  return (
    <div style={S.app}>
      <StyleTag />
      <SuperAdminPanel />
    </div>
  );
}

// ── Authenticated ─────────────────────────────────────────────
function AuthenticatedApp() {
const { profile, company, categories, branches, isVM, isManager, isSuperAdmin } = useApp();
console.log("branches:", branches);
  const { isOnline, queueSize, syncing, syncQueue, submitWithFallback } = useOfflineSync();

  const [vmPage,      setVmPage]      = useState("home");
  const [mgrPage,     setMgrPage]     = useState("overview");
  const [tasks,       setTasks]       = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [guidelines,  setGuidelines]  = useState([]);
  const [teamChat,    setTeamChat]    = useState([]);
  const [mgrChat,     setMgrChat]     = useState([]);
  const [log,         setLog]         = useState([]);
  const [demoHolds,   setDemoHolds]   = useState([]);
  const [floorWalks,  setFloorWalks]  = useState([]);
  const [campaign,    setCampaign]    = useState(null);
  const [dataLoaded,  setDataLoaded]  = useState(false);

  useEffect(() => {
    if (!company) { setDataLoaded(true); return; }
    Promise.all([
      getTasks(company.id).then(setTasks),
      getSubmissions(company.id).then(setSubmissions),
      getGuidelines(company.id).then(setGuidelines),
      getChatMessages(company.id, "team").then(setTeamChat),
      isManager ? getChatMessages(company.id, "managers").then(setMgrChat) : Promise.resolve(),
      isManager ? getActivityLog(company.id).then(setLog) : Promise.resolve(),
      supabase.from("campaigns").select("*")
        .eq("company_id", company.id).eq("is_active", true)
        .order("created_at", { ascending:false }).limit(1)
        .then(({ data }) => setCampaign(data?.[0] ?? null)),
      supabase.from("demo_holds").select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending:false }).limit(50)
        .then(({ data }) => setDemoHolds(data ?? [])),
      supabase.from("floor_walks").select("*, photos:floor_walk_photos(*)")
        .eq("company_id", company.id)
        .order("created_at", { ascending:false }).limit(10)
        .then(({ data }) => setFloorWalks(data ?? [])),
    ]).finally(() => setDataLoaded(true));

    subscribeToPush(profile.id, company.id);
    const teamSub = subscribeToChat(company.id, "team", msg => setTeamChat(p => [...p, msg]));
    const mgrSub  = isManager
      ? subscribeToChat(company.id, "managers", msg => setMgrChat(p => [...p, msg]))
      : null;
    navigator.serviceWorker?.addEventListener("message", e => {
      if (e.data?.type === "TRIGGER_SYNC") syncQueue();
    });
    return () => { teamSub?.unsubscribe?.(); mgrSub?.unsubscribe?.(); };
  }, [company?.id]);

  const addLog = (action, detail) => {
    if (!company) return;
    logActivity(company.id, profile.id, action, detail);
    getActivityLog(company.id).then(setLog);
  };

  const handleSubmit = async (data) => {
    await submitWithFallback({ ...data, company_id:company.id, submitted_by:profile.id });
    if (isOnline) getSubmissions(company.id).then(setSubmissions);
    addLog("Submitted implementation", data.categoryName ?? "");
  };

  const handleReview = async (id, status) => {
    await reviewSubmission(id, status, status==="approved" ? 85 : null, profile.id);
    getSubmissions(company.id).then(setSubmissions);
    addLog(status==="approved" ? "Approved submission" : "Requested revision", "VM submission");
  };

  const handleCreateTask = async (payload) => {
    await createTask({ ...payload, company_id:company.id, created_by:profile.id });
    getTasks(company.id).then(setTasks);
    addLog("Assigned new task", payload.title);
  };

  const handleUploadGuideline = async (title, category, file) => {
    await uploadGuideline(company.id, profile.id, title, category, file);
    getGuidelines(company.id).then(setGuidelines);
    addLog("Uploaded guideline", title);
  };

  const handleAddDemoHold = async ({ item_code, note }) => {
    const { data } = await supabase.from("demo_holds")
      .insert({ company_id:company.id, added_by:profile.id,
        branch_id:profile.branch_id ?? null, item_code, note, time:nowTime() })
      .select().single();
    if (data) setDemoHolds(p => [data, ...p]);
    addLog("Added demo hold", item_code);
  };

  const handleAddFloorWalk = async ({ note, photos }) => {
    const { data: fw } = await supabase.from("floor_walks")
      .insert({ company_id:company.id, added_by:profile.id,
        note, manager:profile.full_name,
        date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }) })
      .select().single();
    if (fw && photos.length > 0) {
      for (const p of photos) {
        const safeName = (p.file?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${company.id}/floorwalk/${fw.id}-${Date.now()}-${safeName}`;
        await supabase.storage.from("vm-photos").upload(path, p.file ?? p);
        const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
        await supabase.from("floor_walk_photos").insert({ floor_walk_id:fw.id, url });
      }
    }
    const { data: updated } = await supabase.from("floor_walks")
      .select("*, photos:floor_walk_photos(*)")
      .eq("company_id", company.id)
      .order("created_at", { ascending:false }).limit(10);
    setFloorWalks(updated ?? []);
    addLog("Added floor walk", note?.slice(0,40) ?? "");
  };

  const handleSaveCampaign = async ({ name, date_from, date_to }) => {
    await supabase.from("campaigns").update({ is_active:false }).eq("company_id", company.id);
    const { data } = await supabase.from("campaigns")
      .insert({ company_id:company.id, name,
        date_from:date_from||null, date_to:date_to||null,
        is_active:true, created_by:profile.id })
      .select().single();
    if (data) setCampaign(data);
    addLog("Updated campaign", name);
  };

  const handleExportPDF = () => {
    exportWeeklyReport({ company, tasks, submissions, branches,
      weekLabel: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) });
  };

  if (!dataLoaded) return <LoadingScreen />;
  if (isSuperAdmin && !company) return <SuperAdminApp />;

  // VM shell
  if (isVM) return (
    <div style={S.app}>
      <StyleTag />
      <TopBar user={profile} onLogout={() => signOut()} />
      <StatusBar isOnline={isOnline} queueSize={queueSize} syncing={syncing} onSyncNow={syncQueue} />
      <div style={{ ...S.main, paddingTop:(!isOnline || queueSize > 0) ? 56 : 18 }}>
        {vmPage==="home"       && <VMHome       user={profile} tasks={tasks} submissions={submissions}
                                    chat={teamChat} demoHolds={demoHolds} onAddDemoHold={handleAddDemoHold}
                                    floorWalks={floorWalks} campaign={campaign} />}
        {vmPage==="tasks"      && <VMTasks      user={profile} categories={categories} branches={branches} tasks={tasks}
                                    setTasks={setTasks} onSubmit={handleSubmit}
                                    onTaskToggle={(id, done) => updateTask(id, { is_done:done })
                                      .then(() => getTasks(company.id).then(setTasks))} />}
        {vmPage==="guidelines" && <VMGuidelines guidelines={guidelines} />}
        {vmPage==="chat"       && <Chat         user={profile} teamMessages={teamChat}
                                    setTeamMessages={setTeamChat} mgrMessages={mgrChat}
                                    setMgrMessages={setMgrChat}
                                    onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} />}
      </div>
      <VMNav page={vmPage} setPage={setVmPage} />
    </div>
  );

  // Manager shell
  return (
    <div style={S.app}>
      <StyleTag />
      <TopBar user={profile} onLogout={() => signOut()} isSuperAdmin={isSuperAdmin}
        onSuperAdmin={() => setMgrPage("superadmin")} />
      <div style={S.main}>
        {mgrPage==="overview"   && <MgrOverview  tasks={tasks} submissions={submissions} log={log}
                                     company={company} campaign={campaign} onSaveCampaign={handleSaveCampaign} />}
        {mgrPage==="requests"   && <MgrRequests  submissions={submissions} onReview={handleReview} />}
        {mgrPage==="assign"     && <MgrAssign    tasks={tasks} categories={categories} guidelines={guidelines}
                                     branches={branches} floorWalks={floorWalks} onCreateTask={handleCreateTask}
                                     onDeleteTask={id => deleteTask(id).then(() => getTasks(company.id).then(setTasks))}
                                     onUploadGuideline={handleUploadGuideline}
                                     onAddFloorWalk={handleAddFloorWalk} />}
        {mgrPage==="reports"    && <MgrReports   tasks={tasks} submissions={submissions} onExportPDF={handleExportPDF} />}
        {mgrPage==="analytics"  && <AnalyticsDashboard tasks={tasks} submissions={submissions} company={company} />}
        {mgrPage==="chat"       && <Chat         user={profile} teamMessages={teamChat}
                                     setTeamMessages={setTeamChat} mgrMessages={mgrChat}
                                     setMgrMessages={setMgrChat}
                                     onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} />}
        {mgrPage==="superadmin" && isSuperAdmin && <SuperAdminPanel />}
      </div>
      <MgrNav page={mgrPage} setPage={setMgrPage} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}

export default function App() {
  const { session, loading } = useApp();
  if (loading)           return <LoadingScreen />;
  if (!session?.profile) return <LoginScreen />;
  return <AuthenticatedApp />;
}