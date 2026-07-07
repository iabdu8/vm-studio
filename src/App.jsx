import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext.jsx";
import { signIn, signOut } from "./services/auth.service.js";
import {
  getTasks, createTask, updateTask, deleteTask,
  getSubmissions, reviewSubmission,
  getGuidelines, uploadGuideline, deleteGuideline,
  sendMessage, getActivityLog, logActivity,
} from "./services/data.service.js";
import {
  getPromotions, createPromotion, deletePromotion,
  getCampaignProgress, initCampaignBranches, setCampaignBranchStatus,
  notifyAll, notifyManagers, notifyUser, notifyBranch,
} from "./services/enterprise.service.js";
import { supabase }             from "./lib/supabase.js";
import { useOfflineSync }       from "./hooks/useOfflineSync.js";
import { exportWeeklyReport }   from "./lib/pdfExport.js";
import { subscribeToPush }      from "./lib/notifications.js";
import { compressImage }        from "./lib/imageCompression.js";
import { StyleTag }             from "./components/shared/Atoms.jsx";
import { Logo }                 from "./components/shared/Logo.jsx";
import { TopBar }               from "./components/shared/TopBar.jsx";
import { VMNav, MgrNav }        from "./components/shared/BottomNav.jsx";
import { RegisterPage }         from "./components/shared/RegisterPage.jsx";
import { Chat }                 from "./components/shared/Chat.jsx";
import { VMGuidelines }         from "./components/shared/Guidelines.jsx";
import { StatusBar }            from "./components/shared/StatusBar.jsx";
import { ToastContainer, toast } from "./components/shared/Toast.jsx";
import { LandingPage }          from "./components/shared/LandingPage.jsx";
import { VMHome }               from "./components/vm/VMHome.jsx";
import { VMTasks }              from "./components/vm/VMTasks.jsx";
import { VMPlan }               from "./components/vm/VMPlan.jsx";
import { VMVisits }             from "./components/vm/VMVisits.jsx";
import { MgrOverview }          from "./components/manager/MgrOverview.jsx";
import { MgrRequests }          from "./components/manager/MgrRequests.jsx";
import { MgrAssign }            from "./components/manager/MgrAssign.jsx";
import { MgrReports }           from "./components/manager/MgrReports.jsx";
import { AnalyticsDashboard }   from "./components/manager/Analytics.jsx";
import { StoreVisits }          from "./components/manager/StoreVisits.jsx";
import { StoreManagerHome, StoreManagerRequests } from "./components/manager/StoreManagerShell.jsx";
import { AreaManagerOverview }  from "./components/manager/AreaManagerShell.jsx";
import { SuperAdminPanel }      from "./components/superadmin/SuperAdminPanel.jsx";
import { S, C }                 from "./styles/theme.js";
import { nowTime }              from "./utils.js";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000088", zIndex:900,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"var(--clr-surface)", borderRadius:16, padding:28,
        maxWidth:360, width:"100%", border:`1px solid ${C.accentColor}22` }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:20, lineHeight:1.5 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btnP" style={{ ...S.btnP, flex:1, background:"#f87171" }} onClick={onConfirm}>Confirm</button>
          <button className="btnG" style={{ ...S.btnG, flex:1 }} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ ...S.loginBg, flexDirection:"column", gap:16 }}>
      <StyleTag />
      <Logo size="lg" />
      <div style={{ color:C.mutedColor, fontSize:13, marginTop:12 }}>Loading…</div>
    </div>
  );
}

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const send = async () => {
    if (!email.trim()) return;
    setLoading(true); setErr("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setSent(true);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  if (sent) return (
    <div style={S.loginBg}><StyleTag />
      <div style={{ ...S.loginCard, textAlign:"center" }} className="fu">
        <div style={{ fontSize:44, marginBottom:16 }}>📧</div>
        <div style={{ ...S.dFont, fontSize:22, fontWeight:700, color:C.accentColor, marginBottom:8 }}>Check your email</div>
        <div style={{ ...S.muted, marginBottom:24 }}>Reset link sent to <strong>{email}</strong></div>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={onBack}>Back to Sign In</button>
      </div>
    </div>
  );
  return (
    <div style={S.loginBg}><StyleTag />
      <div style={S.loginCard} className="fu">
        <div style={{ ...S.dFont, fontSize:28, fontWeight:700, color:C.accentColor, marginBottom:4 }}>Reset Password</div>
        <div style={{ ...S.muted, fontSize:12, marginBottom:24 }}>We'll send a reset link to your email.</div>
        <div style={S.lbl}>Email</div>
        <input style={S.inp} type="email" placeholder="your@email.com" value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key==="Enter" && send()} />
        {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
        <button className="btnP" style={{ ...S.btnP, width:"100%", marginBottom:10 }} onClick={send} disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link →"}
        </button>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.mutedColor,
          cursor:"pointer", fontSize:12, width:"100%", textAlign:"center", fontFamily:"'DM Sans',sans-serif" }}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  );
}

function LoginScreen({ onBack }) {
  const [view, setView]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const go = async () => {
    if (!email || !password) return;
    setLoading(true); setErr("");
    try { await signIn(email, password); }
    catch (e) { setErr(e.message); } finally { setLoading(false); }
  };
  if (view === "register") return <RegisterPage onBack={() => setView("login")} />;
  if (view === "forgot")   return <ForgotPassword onBack={() => setView("login")} />;
  return (
    <div style={S.loginBg}><StyleTag />
      <div style={S.loginCard} className="fu">
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <Logo size="lg" />
        </div>
        <div style={S.lbl}>Email</div>
        <input style={S.inp} type="email" placeholder="Email address" value={email}
          onChange={e => { setEmail(e.target.value); setErr(""); }} onKeyDown={e => e.key==="Enter" && go()} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={S.lbl}>Password</div>
          <button onClick={() => setView("forgot")} style={{ background:"none", border:"none", color:C.mutedColor,
            cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif", padding:0, marginBottom:4 }}>
            Forgot password?
          </button>
        </div>
        <input style={S.inp} type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && go()} />
        {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:10 }}>{err}</div>}
        <button className="btnP" style={{ ...S.btnP, width:"100%", padding:"13px", fontSize:14 }}
          onClick={go} disabled={loading}>{loading ? "Signing in…" : "Sign In →"}</button>
        {onBack && (
          <div style={{ textAlign:"center", marginTop:16 }}>
            <button onClick={onBack} style={{ background:"none", border:"none", color:C.mutedColor,
              cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { profile, company, categories, branches, isVM, isManager, isAreaManager, isStoreManager, isSuperAdmin } = useApp();
  const { isOnline, queueSize, syncing, syncQueue, submitWithFallback } = useOfflineSync();
  const [vmPage,  setVmPage]  = useState("home");
  const [mgrPage, setMgrPage] = useState("overview");
  const [smPage,  setSmPage]  = useState("home");
  const [amPage,  setAmPage]  = useState("overview");
  const [tasks,        setTasks]        = useState([]);
  const [submissions,  setSubmissions]  = useState([]);
  const [guidelines,   setGuidelines]   = useState([]);
  const [log,          setLog]          = useState([]);
  const [demoHolds,    setDemoHolds]    = useState([]);
  const [floorWalks,   setFloorWalks]   = useState([]);
  const [campaign,     setCampaign]     = useState(null);
  const [campaignProgress, setCampaignProgress] = useState([]);
  const [promotions,   setPromotions]   = useState([]);
  const [visits,       setVisits]       = useState([]);
  const [localBranches, setLocalBranches] = useState([]);
  const [dataLoaded,   setDataLoaded]   = useState(false);
  const [confirm,      setConfirm]      = useState(null);
  const showConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  const loadVisits = async (cid) => {
    const { data } = await supabase.from("store_visits")
      .select("*, visitor:visitor_id(full_name), findings:visit_findings(*)")
      .eq("company_id", cid).order("created_at", { ascending:false }).limit(20);
    setVisits(data ?? []);
  };

  const loadFloorWalks = async (cid) => {
    const { data } = await supabase.from("floor_walks")
      .select("*, photos:floor_walk_photos(*)")
      .eq("company_id", cid).order("created_at", { ascending:false }).limit(10);
    setFloorWalks(data ?? []);
  };

  useEffect(() => {
    if (!company) { setDataLoaded(true); return; }
    Promise.all([
      getTasks(company.id).then(setTasks),
      getSubmissions(company.id).then(setSubmissions),
      getGuidelines(company.id).then(setGuidelines),
      (isManager || isAreaManager) ? getActivityLog(company.id).then(setLog) : Promise.resolve(),
      supabase.from("branches").select("*").eq("company_id", company.id).eq("is_active", true).order("sort_order")
        .then(({ data }) => setLocalBranches(data ?? [])),
      supabase.from("campaigns").select("*").eq("company_id", company.id).eq("is_active", true)
        .order("created_at", { ascending:false }).limit(1)
        .then(({ data }) => { const c = data?.[0] ?? null; setCampaign(c); if (c) getCampaignProgress(c.id).then(setCampaignProgress); }),
      getPromotions(company.id).then(setPromotions),
      supabase.from("demo_holds").select("*").eq("company_id", company.id)
        .order("created_at", { ascending:false }).limit(50).then(({ data }) => setDemoHolds(data ?? [])),
      loadFloorWalks(company.id),
      loadVisits(company.id),
    ]).finally(() => setDataLoaded(true));
    subscribeToPush(profile.id, company.id);
    navigator.serviceWorker?.addEventListener("message", e => { if (e.data?.type === "TRIGGER_SYNC") syncQueue(); });
  }, [company?.id]);

  const activeBranches = localBranches.length > 0 ? localBranches : (branches ?? []);
  const addLog = (action, detail) => { if (!company) return; logActivity(company.id, profile.id, action, detail); getActivityLog(company.id).then(setLog); };

  const handleSubmit = async (data) => {
    const { before, after, note, category_id, subcategory_id, branch_id, category_name, subcategory_name, branch_name } = data;
    const payload = { company_id:company.id, submitted_by:profile.id, category_id:category_id||null, subcategory_id:subcategory_id||null, branch_id:branch_id||null, category_name:category_name||null, subcategory_name:subcategory_name||null, branch_name:branch_name||null, note:note||null, status:"pending" };
    try {
      await submitWithFallback({ ...payload, before, after });
      toast("Report submitted!", "success");
      if (isOnline) getSubmissions(company.id).then(setSubmissions);
      addLog("Submitted implementation", category_name ?? "");
      notifyManagers(company.id, "submission_new", "New Submission 📤", (profile.full_name ?? "") + " submitted a VM report");
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to submit. Please try again."); }
  };

  const handleReview = async (id, status, revisionNote) => {
    try {
      await reviewSubmission(id, status, status==="approved" ? 85 : null, profile.id, revisionNote);
      getSubmissions(company.id).then(setSubmissions);
      addLog(status==="approved" ? "Approved submission" : "Requested revision", "VM submission");
      const sub = submissions.find(s => s.id === id);
      if (sub?.submitted_by) notifyUser(company.id, sub.submitted_by, status==="approved" ? "submission_approved" : "submission_revision", status==="approved" ? "Submission Approved ✅" : "Revision Requested ↩️", status==="approved" ? "Your VM report was approved!" : (revisionNote || "Your VM report needs revision."));
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to update submission."); }
  };

  const handleDeleteSubmission = (id) => showConfirm("Delete this submission permanently?", async () => { await supabase.from("submissions").delete().eq("id", id); setSubmissions(p => p.filter(x => x.id !== id)); setConfirm(null); });
  const handleAddNote = async (sid, note) => { await supabase.from("submissions").update({ manager_note: note }).eq("id", sid); getSubmissions(company.id).then(setSubmissions); };

  const handleCreateTask = async (payload) => {
    try {
      await createTask({ ...payload, company_id:company.id, created_by:profile.id });
      getTasks(company.id).then(setTasks);
      addLog("Assigned new task", payload.title);
      if (payload.assigned_to && payload.assigned_to !== "all") notifyUser(company.id, payload.assigned_to, "task_created", "New Task Assigned 📋", payload.title ?? "");
      else notifyAll(company.id, "task_created", "New Task Assigned 📋", payload.title ?? "");
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to create task."); }
  };

  const handleDeleteTask = (id) => showConfirm("Delete this task?", async () => { await deleteTask(id); getTasks(company.id).then(setTasks); setConfirm(null); });

  const handleUploadGuideline = async (title, category, file) => {
    try { await uploadGuideline(company.id, profile.id, title, category, file); getGuidelines(company.id).then(setGuidelines); addLog("Uploaded guideline", title); notifyAll(company.id, "guideline_new", "New Guideline Published 📖", title); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to upload guideline."); }
  };

  const handleDeleteGuideline = (id) => showConfirm("Delete this guideline?", async () => { await deleteGuideline(id); setGuidelines(p => p.filter(x => x.id !== id)); addLog("Deleted guideline", id); setConfirm(null); });

  const handleAddDemoHold = async ({ item_code, note }) => {
    try {
      const { data } = await supabase.from("demo_holds").insert({ company_id:company.id, added_by:profile.id, branch_id:profile.branch_id??null, item_code, note, time:nowTime() }).select().single();
      if (data) setDemoHolds(p => [data, ...p]);
      addLog("Added demo hold", item_code);
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to add item."); }
  };

  const handleAddFloorWalk = async ({ note, photos }) => {
    try {
      const { data: fw } = await supabase.from("floor_walks").insert({ company_id:company.id, added_by:profile.id, note, manager:profile.full_name, date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }) }).select().single();
      if (fw && photos.length > 0) {
        for (const p of photos) {
          const compressed = await compressImage(p.file ?? p, "floorWalk");
          const safeName = (compressed?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${company.id}/floorwalk/${fw.id}-${Date.now()}-${safeName}`;
          await supabase.storage.from("vm-photos").upload(path, compressed);
          const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
          await supabase.from("floor_walk_photos").insert({ floor_walk_id:fw.id, url, comment:p.comment??"" });
        }
      }
      loadFloorWalks(company.id);
      addLog("Added floor walk", note?.slice(0,40) ?? "");
      if (profile.branch_id) notifyBranch(company.id, profile.branch_id, "visit_created", "New Floor Walk 🚶", "Manager published a new floor walk");
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to publish floor walk."); }
  };

  const handleSaveCampaign = async ({ name, date_from, date_to }) => {
    try {
      await supabase.from("campaigns").update({ is_active:false }).eq("company_id", company.id);
      const { data } = await supabase.from("campaigns").insert({ company_id:company.id, name, date_from:date_from||null, date_to:date_to||null, is_active:true, created_by:profile.id }).select().single();
      if (data) { setCampaign(data); await initCampaignBranches(data.id, activeBranches.map(b => b.id)); getCampaignProgress(data.id).then(setCampaignProgress); }
      addLog("Updated campaign", name);
      notifyAll(company.id, "campaign_created", "New Campaign 📣", name);
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to save campaign."); }
  };

  const handleSetBranchStatus = async (branch_id, status) => { if (!campaign?.id) return; await setCampaignBranchStatus(campaign.id, branch_id, status); getCampaignProgress(campaign.id).then(setCampaignProgress); };
  const handleCreatePromotion = async (payload, branchIds) => { await createPromotion({ ...payload, company_id:company.id, created_by:profile.id }, branchIds); getPromotions(company.id).then(setPromotions); addLog("Created promotion", payload.name); notifyAll(company.id, "guideline_new", "New Promotion 🏷️", payload.name); };
  const handleDeletePromotion = async (id) => { await deletePromotion(id); setPromotions(p => p.filter(x => x.id !== id)); };
  const handleDeleteVisit = (id) => showConfirm("Delete this visit report?", async () => { await supabase.from("store_visits").delete().eq("id", id); setVisits(p => p.filter(x => x.id !== id)); setConfirm(null); });
  const handleDeleteDemoHold = (id) => showConfirm("Remove this item from hold?", async () => { await supabase.from("demo_holds").delete().eq("id", id); setDemoHolds(p => p.filter(x => x.id !== id)); setConfirm(null); });
  const handleExportPDF = () => exportWeeklyReport({ company, tasks, submissions, branches:activeBranches, weekLabel: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) });

  if (!dataLoaded) return <LoadingScreen />;
  if (isSuperAdmin && !company) return <div style={S.app}><StyleTag /><SuperAdminPanel /></div>;

  return (
    <>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      {isVM && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <StatusBar isOnline={isOnline} queueSize={queueSize} syncing={syncing} onSyncNow={syncQueue} />
          <div style={{ ...S.main, paddingTop:(!isOnline || queueSize > 0) ? 56 : 18 }}>
            {vmPage==="home"       && <VMHome user={profile} tasks={tasks} submissions={submissions} demoHolds={demoHolds} onAddDemoHold={handleAddDemoHold} campaign={campaign} promotions={promotions} />}
            {vmPage==="tasks"      && <VMTasks user={profile} categories={categories} branches={activeBranches} tasks={tasks} setTasks={setTasks} submissions={submissions} demoHolds={demoHolds} onAddDemoHold={handleAddDemoHold} onDeleteDemoHold={handleDeleteDemoHold} company={company} profile={profile} onSubmit={handleSubmit} onTaskToggle={(id, done) => updateTask(id, { is_done:done }).then(() => getTasks(company.id).then(setTasks))} />}
            {vmPage==="plan"       && <VMPlan profile={profile} company={company} />}
            {vmPage==="visits"     && <VMVisits profile={profile} floorWalks={floorWalks} />}
            {vmPage==="guidelines" && <VMGuidelines guidelines={guidelines} userId={profile.id} />}
            {vmPage==="chat"       && <Chat user={profile} onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} companyId={company.id} branches={activeBranches} />}
          </div>
          <VMNav page={vmPage} setPage={setVmPage} />
        </div>
      )}

      {isStoreManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <div style={S.main}>
            {smPage==="home"     && <StoreManagerHome profile={profile} tasks={tasks} submissions={submissions} campaign={campaign} promotions={promotions} floorWalks={floorWalks} demoHolds={demoHolds} />}
            {smPage==="requests" && <StoreManagerRequests submissions={submissions} onAddNote={handleAddNote} />}
            {smPage==="chat"     && <Chat user={profile} onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} companyId={company.id} branches={activeBranches} />}
          </div>
          <nav style={S.bottomNav}>
            {[["home","🏠","Home"],["requests","📥","Submissions"],["chat","💬","Chat"]].map(([k,icon,lbl]) => (
              <button key={k} className="tab-btn" style={S.navBtn(smPage===k)} onClick={() => setSmPage(k)}>
                <span style={{ fontSize:20 }}>{icon}</span><span>{lbl}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {isAreaManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <div style={S.main}>
            {amPage==="overview" && <AreaManagerOverview profile={profile} tasks={tasks} submissions={submissions} campaign={campaign} campaignProgress={campaignProgress} branches={activeBranches} />}
            {amPage==="requests" && <MgrRequests submissions={submissions} onReview={handleReview} />}
            {amPage==="visits"   && <StoreVisits company={company} branches={activeBranches} profile={profile} visits={visits} floorWalks={floorWalks} onVisitCreated={() => loadVisits(company.id)} onDeleteVisit={handleDeleteVisit} onAddFloorWalk={handleAddFloorWalk} />}
            {amPage==="chat"     && <Chat user={profile} onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} companyId={company.id} branches={activeBranches} />}
          </div>
          <nav style={S.bottomNav}>
            {[["overview","📊","Overview"],["requests","📥","Requests"],["visits","🚶","Visits"],["chat","💬","Chat"]].map(([k,icon,lbl]) => (
              <button key={k} className="tab-btn" style={S.navBtn(amPage===k)} onClick={() => setAmPage(k)}>
                <span style={{ fontSize:20 }}>{icon}</span><span>{lbl}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {isManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} isSuperAdmin={isSuperAdmin} onSuperAdmin={() => setMgrPage("superadmin")} />
          <div style={S.main}>
            {mgrPage==="overview"   && <MgrOverview tasks={tasks} submissions={submissions} log={log} company={company} branches={activeBranches} campaign={campaign} onSaveCampaign={handleSaveCampaign} campaignProgress={campaignProgress} onSetBranchStatus={handleSetBranchStatus} promotions={promotions} onCreatePromotion={handleCreatePromotion} onDeletePromotion={handleDeletePromotion} />}
            {mgrPage==="requests"   && <MgrRequests submissions={submissions} onReview={handleReview} onDeleteSubmission={handleDeleteSubmission} />}
            {mgrPage==="assign"     && <MgrAssign tasks={tasks} categories={categories} branches={activeBranches} company={company} guidelines={guidelines} profile={profile} onCreateTask={handleCreateTask} onDeleteTask={handleDeleteTask} onUploadGuideline={handleUploadGuideline} onDeleteGuideline={handleDeleteGuideline} />}
            {mgrPage==="reports"    && <MgrReports tasks={tasks} submissions={submissions} onExportPDF={handleExportPDF} />}
            {mgrPage==="visits"     && <StoreVisits company={company} branches={activeBranches} profile={profile} visits={visits} floorWalks={floorWalks} onVisitCreated={() => loadVisits(company.id)} onDeleteVisit={handleDeleteVisit} onAddFloorWalk={handleAddFloorWalk} />}
            {mgrPage==="analytics"  && <AnalyticsDashboard tasks={tasks} submissions={submissions} company={company} />}
            {mgrPage==="chat"       && <Chat user={profile} onSend={(room, body) => sendMessage(company.id, profile.id, room, body)} companyId={company.id} branches={activeBranches} />}
            {mgrPage==="superadmin" && isSuperAdmin && <SuperAdminPanel />}
          </div>
          <MgrNav page={mgrPage} setPage={setMgrPage} isSuperAdmin={isSuperAdmin} />
        </div>
      )}
    </>
  );
}

// ── ROOT ─────────────────────────────────────────────────────
export default function App() {
  const { session, loading } = useApp();
  const [showLanding, setShowLanding] = useState(
    () => !localStorage.getItem("vismo_skip_landing")
  );

  const handleEnterApp = () => {
    localStorage.setItem("vismo_skip_landing", "1");
    setShowLanding(false);
  };

  useEffect(() => {
    if (session?.profile) setShowLanding(false);
  }, [session]);

  if (loading) return <LoadingScreen />;

  if (showLanding) return (
    <>
      <ToastContainer />
      <LandingPage onEnterApp={handleEnterApp} />
    </>
  );

  if (!session?.profile) return (
    <>
      <ToastContainer />
      <LoginScreen onBack={() => { localStorage.removeItem("vismo_skip_landing"); setShowLanding(true); }} />
    </>
  );

  return (
    <>
      <ToastContainer />
      <AuthenticatedApp />
    </>
  );
}