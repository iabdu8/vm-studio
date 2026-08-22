import { useState, useEffect } from "react";
import { useApp } from "./context/AppContext.jsx";
import { signIn, signOut } from "./services/auth.service.js";
import {
  getTasks, updateTask,
  getSubmissions, reviewSubmission,
  getGuidelines, uploadGuideline, deleteGuideline,
  sendMessage, getActivityLog, logActivity,
} from "./services/data.service.js";
import {
  getPromotions, createPromotion, deletePromotion,
  getCampaignProgress, initCampaignBranches, setCampaignBranchStatus,
  notifyBranchController, notifyUser,
  getCampaignAcknowledgement, acknowledgeCampaign,
  uploadCampaignBranchFile, reviewCampaignBranchFile,
} from "./services/enterprise.service.js";
import { supabase }             from "./lib/supabase.js";
import { useOfflineSync }       from "./hooks/useOfflineSync.js";
import { exportWeeklyReport }   from "./lib/pdfExport.js";
import { subscribeToPush }      from "./lib/notifications.js";
import { StyleTag }             from "./components/shared/Atoms.jsx";
import { Logo }                 from "./components/shared/Logo.jsx";
import { TopBar }               from "./components/shared/TopBar.jsx";
import { VMNav, MgrNav }        from "./components/shared/BottomNav.jsx";
import { RegisterPage }         from "./components/shared/RegisterPage.jsx";
import { Chat }                 from "./components/shared/Chat.jsx";
import { VMGuidelines }         from "./components/shared/Guidelines.jsx";
import { StatusBar }            from "./components/shared/StatusBar.jsx";
import { ToastContainer, toast } from "./components/shared/Toast.jsx";
import { HomeIcon, RequestsIcon, ChatIcon, OverviewIcon, VisitsIcon, AssignIcon, AnalyticsIcon, CalendarIcon, GuidesIcon, TasksIcon } from "./components/shared/Icons.jsx";
import { VMHome }               from "./components/vm/VMHome.jsx";
import { VMTasks }              from "./components/vm/VMTasks.jsx";
import { WeeklyPlan }           from "./components/manager/WeeklyPlan.jsx";
import { VMVisits }             from "./components/vm/VMVisits.jsx";
import { MgrOverview }          from "./components/manager/MgrOverview.jsx";
import { MgrRequests }          from "./components/manager/MgrRequests.jsx";
import { MgrAssign }            from "./components/manager/MgrAssign.jsx";
import { Training }             from "./components/manager/Training.jsx";
import { CampaignGuidesPage }   from "./components/manager/CampaignGuidesPage.jsx";
import { MgrReports }           from "./components/manager/MgrReports.jsx";
import { StoreVisits }          from "./components/manager/StoreVisits.jsx";
import { StoreManagerHome }     from "./components/manager/StoreManagerShell.jsx";
import { StoreManagerAssign }   from "./components/manager/StoreManagerAssign.jsx";
import { StoreManagerCampaignGuides } from "./components/manager/StoreManagerCampaignGuides.jsx";
import { VMDemoHold } from "./components/vm/VMDemoHold.jsx";
import { InfoBanner } from "./components/shared/InfoBanner.jsx";
import { WelcomeModal } from "./components/shared/WelcomeModal.jsx";
import { AreaManagerOverview, AreaManagerRequests, AreaManagerCampaignGuides } from "./components/manager/AreaManagerShell.jsx";
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
  const { justConfirmedEmail, clearJustConfirmedEmail } = useApp();
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
        {justConfirmedEmail && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", marginBottom:16,
            background:"#4ade8018", border:"1px solid #4ade8044", borderRadius:10, fontSize:13, color:"#4ade80" }}>
            ✓ Email confirmed — sign in below.
            <button onClick={clearJustConfirmedEmail} style={{ marginLeft:"auto", background:"none", border:"none",
              color:"#4ade80", cursor:"pointer", fontSize:14, lineHeight:1 }}>✕</button>
          </div>
        )}
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
        <div style={{ textAlign:"center", marginTop:14 }}>
          <button onClick={() => setView("register")} style={{ background:"none", border:"none", color:C.mutedColor,
            cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            Have an invite code? <span style={{ color:C.accentColor, fontWeight:600 }}>Create account →</span>
          </button>
        </div>
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
  const { profile, company, categories, branches, managerBranches, isVM, isManager, isAreaManager, isStoreManager, isSuperAdmin } = useApp();
  const { isOnline, queueSize, syncing, syncQueue, submitWithFallback } = useOfflineSync();
  const [vmPage,  setVmPage]  = useState("home");
  const [mgrPage, setMgrPage] = useState("overview");
  const [smPage,  setSmPage]  = useState("home");
  const [amPage,  setAmPage]  = useState("overview");
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (company?.slug !== "vismo-demo") return;
    if (localStorage.getItem(`vismo_welcome_seen_${profile?.id}`)) return;
    setShowWelcome(true);
  }, [company?.slug, profile?.id]);
  const dismissWelcome = () => {
    localStorage.setItem(`vismo_welcome_seen_${profile?.id}`, "1");
    setShowWelcome(false);
  };
  const [tasks,        setTasks]        = useState([]);
  const [submissions,  setSubmissions]  = useState([]);
  const [guidelines,   setGuidelines]   = useState([]);
  const [log,          setLog]          = useState([]);
  const [demoHolds,    setDemoHolds]    = useState([]);
  const [floorWalks,   setFloorWalks]   = useState([]);
  const [campaign,     setCampaign]     = useState(null);
  const [campaignAck,  setCampaignAck]  = useState(null);
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

    // Critical path: only what's needed for the first screen blocks the loading gate.
    const critical = Promise.allSettled([
      getTasks(company.id).then(setTasks),
      getSubmissions(company.id).then(setSubmissions),
      getGuidelines(company.id).then(setGuidelines),
      supabase.from("branches").select("*").eq("company_id", company.id).eq("is_active", true).order("sort_order")
        .then(({ data }) => setLocalBranches(data ?? [])),
    ]);

    // Everything else loads in the background without blocking the UI.
    const background = Promise.allSettled([
      (isManager || isAreaManager) ? getActivityLog(company.id).then(setLog) : Promise.resolve(),
      supabase.from("campaigns").select("*, uploader:file_uploaded_by(full_name)").eq("company_id", company.id).eq("is_active", true)
        .order("created_at", { ascending:false }).limit(1)
        .then(({ data }) => { const c = data?.[0] ?? null; setCampaign(c); if (c) { getCampaignProgress(c.id).then(setCampaignProgress); getCampaignAcknowledgement(c.id).then(setCampaignAck); } }),
      getPromotions(company.id).then(setPromotions),
      supabase.from("demo_holds").select("*").eq("company_id", company.id)
        .order("created_at", { ascending:false }).limit(50).then(({ data }) => setDemoHolds(data ?? [])),
      loadFloorWalks(company.id),
      loadVisits(company.id),
    ]);

    Promise.all([critical, background]).then(([criticalResults, backgroundResults]) => {
      const failed = [...criticalResults, ...backgroundResults].filter(r => r.status === "rejected");
      if (failed.length) {
        process.env?.NODE_ENV !== "production" && console.error(failed.map(f => f.reason));
        toast("Some data failed to load — pull down or reopen the app to retry.");
      }
    });
    critical.finally(() => setDataLoaded(true));

    subscribeToPush(profile.id, company.id);
    navigator.serviceWorker?.addEventListener("message", e => { if (e.data?.type === "TRIGGER_SYNC") syncQueue(); });
  }, [company?.id]);

  const activeBranches = localBranches.length > 0 ? localBranches : (branches ?? []);
  const addLog = (action, detail) => { if (!company) return; logActivity(company.id, profile.id, action, detail); getActivityLog(company.id).then(setLog); };

  const handleSubmit = async (data) => {
    const { before, after, note, task_id, category_id, subcategory_id, branch_id, category_name, subcategory_name, branch_name } = data;
    const payload = { company_id:company.id, submitted_by:profile.id, task_id:task_id||null, category_id:category_id||null, subcategory_id:subcategory_id||null, branch_id:branch_id||null, category_name:category_name||null, subcategory_name:subcategory_name||null, branch_name:branch_name||null, note:note||null, status:"pending" };
    try {
      await submitWithFallback({ ...payload, before, after });
      toast("Report submitted!", "success");
      if (isOnline) getSubmissions(company.id).then(setSubmissions);
      addLog("Submitted implementation", category_name ?? "");
      if (branch_id) notifyBranchController(company.id, branch_id, "submission_new", "New Submission 📤", (profile.full_name ?? "") + " submitted a VM report");
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast(e?.message ? `Failed to submit: ${e.message}` : "Failed to submit. Please try again."); }
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

  const handleDeleteSubmission = (id) => showConfirm("Delete this submission permanently?", async () => {
    try { await supabase.from("submissions").delete().eq("id", id); setSubmissions(p => p.filter(x => x.id !== id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to delete submission."); }
    finally { setConfirm(null); }
  });


  const handleUploadGuideline = async (title, category, file) => {
    try { await uploadGuideline(company.id, profile.id, title, category, file); getGuidelines(company.id).then(setGuidelines); addLog("Uploaded guideline", title); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to upload guideline."); }
  };

  const handleDeleteGuideline = (id) => showConfirm("Delete this guideline?", async () => {
    try { await deleteGuideline(id); setGuidelines(p => p.filter(x => x.id !== id)); addLog("Deleted guideline", id); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to delete guideline."); }
    finally { setConfirm(null); }
  });

  const handleAddDemoHold = async ({ item_code, note }) => {
    try {
      const { data } = await supabase.from("demo_holds").insert({ company_id:company.id, added_by:profile.id, branch_id:profile.branch_id??null, item_code, note, time:nowTime() }).select().single();
      if (data) setDemoHolds(p => [data, ...p]);
      addLog("Added demo hold", item_code);
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to add item."); }
  };

  const handleFloorWalkChanged = () => { loadFloorWalks(company.id); addLog("Published floor walk", ""); };

  const handleSaveCampaign = async ({ name, date_from, date_to }) => {
    try {
      if (campaign?.id) {
        // Editing the active campaign: update in place, keep progress/ack/files intact.
        const { data } = await supabase.from("campaigns")
          .update({ name, date_from: date_from || null, date_to: date_to || null })
          .eq("id", campaign.id).select().single();
        if (data) setCampaign(data);
        addLog("Updated campaign", name);
      } else {
        // No active campaign: start a new one.
        const { data } = await supabase.from("campaigns")
          .insert({ company_id:company.id, name, date_from:date_from||null, date_to:date_to||null, is_active:true, created_by:profile.id })
          .select().single();
        if (data) { setCampaign(data); setCampaignAck(null); await initCampaignBranches(data.id, activeBranches.map(b => b.id)); getCampaignProgress(data.id).then(setCampaignProgress); }
        addLog("Started campaign", name);
      }
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to save campaign."); }
  };

  const handleDeleteCampaign = () => showConfirm("End the current campaign? Branches will no longer see it.", async () => {
    try {
      if (campaign?.id) await supabase.from("campaigns").update({ is_active:false }).eq("id", campaign.id);
      setCampaign(null); setCampaignProgress([]); setCampaignAck(null);
      addLog("Ended campaign", campaign?.name ?? "");
    } catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to end campaign."); }
    finally { setConfirm(null); }
  });

  const handleAcknowledgeCampaign = async (campaign_id) => {
    try { setCampaignAck(await acknowledgeCampaign(campaign_id, profile.id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to acknowledge campaign."); }
  };


  const handleSetBranchStatus = async (branch_id, status) => {
    if (!campaign?.id) return;
    try { await setCampaignBranchStatus(campaign.id, branch_id, status); getCampaignProgress(campaign.id).then(setCampaignProgress); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to update branch status."); }
  };

  const handleUploadBranchCampaignFile = async (branch_id, file) => {
    if (!campaign?.id) return;
    try { await uploadCampaignBranchFile(campaign.id, branch_id, profile.id, file); getCampaignProgress(campaign.id).then(setCampaignProgress); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to upload campaign file. Please try again."); }
  };

  const handleReviewCampaignBranchFile = async (branch_id, status, note) => {
    if (!campaign?.id) return;
    try { await reviewCampaignBranchFile(campaign.id, branch_id, status, note, profile.id); getCampaignProgress(campaign.id).then(setCampaignProgress); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to save review. Please try again."); }
  };
  const handleCreatePromotion = async (payload, branchIds) => {
    try { await createPromotion({ ...payload, company_id:company.id, created_by:profile.id }, branchIds); getPromotions(company.id).then(setPromotions); addLog("Created promotion", payload.name); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to create promotion."); }
  };
  const handleDeletePromotion = async (id) => {
    try { await deletePromotion(id); setPromotions(p => p.filter(x => x.id !== id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to delete promotion."); }
  };
  const handleDeleteVisit = (id) => showConfirm("Delete this visit report?", async () => {
    try { await supabase.from("store_visits").delete().eq("id", id); setVisits(p => p.filter(x => x.id !== id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to delete visit report."); }
    finally { setConfirm(null); }
  });
  const handleDeleteFloorWalk = (id) => showConfirm("Delete this floor walk report?", async () => {
    try { await supabase.from("floor_walks").delete().eq("id", id); setFloorWalks(p => p.filter(x => x.id !== id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to delete floor walk."); }
    finally { setConfirm(null); }
  });
  const handleDeleteDemoHold = (id) => showConfirm("Remove this item from hold?", async () => {
    try { await supabase.from("demo_holds").delete().eq("id", id); setDemoHolds(p => p.filter(x => x.id !== id)); }
    catch (e) { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to remove item."); }
    finally { setConfirm(null); }
  });
  const handleExportPDF = () => exportWeeklyReport({ company, tasks, submissions, branches:activeBranches, weekLabel: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }) });
  const handleExportBranchPDF = () => exportWeeklyReport({
    company,
    tasks: tasks.filter(t => t.branch_id === profile.branch_id),
    submissions: submissions.filter(s => s.branch_id === profile.branch_id),
    branches: activeBranches.filter(b => b.id === profile.branch_id),
    weekLabel: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" }),
  });

  if (!dataLoaded) return <LoadingScreen />;
  if (isSuperAdmin && !company) return <div style={S.app}><StyleTag /><SuperAdminPanel /></div>;

  return (
    <>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
      {showWelcome && <WelcomeModal role={profile?.role} onClose={dismissWelcome} />}

      {isVM && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <StatusBar isOnline={isOnline} queueSize={queueSize} syncing={syncing} onSyncNow={syncQueue} />
          <div key={vmPage} className="page-transition" style={{ ...S.main, paddingTop:(!isOnline || queueSize > 0) ? 56 : 18 }}>
            {vmPage==="home"       && <VMHome user={profile} tasks={tasks} submissions={submissions} campaign={campaign} promotions={promotions} company={company} />}
            {vmPage==="tasks"      && <VMTasks user={profile} categories={categories} branches={activeBranches} tasks={tasks} company={company} profile={profile} onSubmit={handleSubmit} onTaskToggle={(id, done) => updateTask(id, { is_done:done }).then(() => getTasks(company.id).then(setTasks)).catch(e => { process.env?.NODE_ENV !== "production" && console.error(e); toast("Failed to update task. Please try again."); })} />}
            {vmPage==="demo"       && <VMDemoHold demoHolds={demoHolds.filter(d => d.branch_id === profile.branch_id)} onAddDemoHold={handleAddDemoHold} onDeleteDemoHold={handleDeleteDemoHold} company={company} profile={profile} />}
            {vmPage==="visits"     && <VMVisits profile={profile} floorWalks={floorWalks} company={company} />}
            {vmPage==="guidelines" && <VMGuidelines guidelines={guidelines} userId={profile.id} branchId={profile.branch_id} campaign={campaign} campaignProgress={campaignProgress} company={company} />}
            {vmPage==="chat"       && <Chat user={profile} onSend={(room, body, attachment) => sendMessage(company.id, profile.id, room, body, attachment)} companyId={company.id} branches={activeBranches} />}
          </div>
          <VMNav page={vmPage} setPage={setVmPage} />
        </div>
      )}

      {isStoreManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <div key={smPage} className="page-transition" style={S.main}>
            {smPage==="home"     && <StoreManagerHome profile={profile} tasks={tasks} submissions={submissions} campaign={campaign} promotions={promotions} floorWalks={floorWalks} company={company} />}
            {smPage==="assign"   && <StoreManagerAssign categories={categories} branches={activeBranches} profile={profile} company={company} onTasksChanged={() => getTasks(company.id).then(setTasks)} />}
            {smPage==="requests" && <MgrRequests submissions={submissions.filter(s => s.branch_id === profile.branch_id)} onReview={handleReview} profile={profile} />}
            {smPage==="campaign" && <StoreManagerCampaignGuides campaign={campaign} campaignProgress={campaignProgress} profile={profile} guidelines={guidelines} company={company} />}
            {smPage==="demo"     && <VMDemoHold demoHolds={demoHolds.filter(d => d.branch_id === profile.branch_id)} onAddDemoHold={handleAddDemoHold} onDeleteDemoHold={handleDeleteDemoHold} company={company} profile={profile} />}
            {smPage==="visits"   && <StoreVisits company={company} branches={activeBranches.filter(b => b.id === profile.branch_id)} profile={profile} visits={visits} floorWalks={floorWalks} onFloorWalkChanged={handleFloorWalkChanged} onDeleteFloorWalk={handleDeleteFloorWalk} canCreateVisit={false} />}
            {smPage==="reports"  && <MgrReports tasks={tasks.filter(t => t.branch_id === profile.branch_id)} submissions={submissions.filter(s => s.branch_id === profile.branch_id)} onExportPDF={handleExportBranchPDF} />}
            {smPage==="chat"     && <Chat user={profile} onSend={(room, body, attachment) => sendMessage(company.id, profile.id, room, body, attachment)} companyId={company.id} branches={activeBranches} />}
          </div>
          <nav style={S.bottomNav}>
            {[["home",HomeIcon,"Home"],["assign",AssignIcon,"Tasks"],["requests",RequestsIcon,"Approvals"],["campaign",GuidesIcon,"Campaign"],["demo",TasksIcon,"Demo Hold"],["visits",VisitsIcon,"Floor Walk"],["reports",AnalyticsIcon,"Reports"],["chat",ChatIcon,"Chat"]].map(([k,Icon,lbl]) => (
              <button key={k} className="tab-btn" style={S.navBtn(smPage===k)} onClick={() => setSmPage(k)}>
                <Icon size={22} /><span>{lbl}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {isAreaManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} />
          <div key={amPage} className="page-transition" style={S.main}>
            {amPage==="overview" && <AreaManagerOverview profile={profile} tasks={tasks} submissions={submissions} branches={activeBranches} managerBranches={managerBranches} company={company} campaign={campaign} />}
            {amPage==="requests" && <AreaManagerRequests submissions={submissions} profile={profile} branches={activeBranches} managerBranches={managerBranches} />}
            {amPage==="plan"     && (
              <>
                <InfoBanner>Weekly plans for your assigned branches, set by each branch's VM Controller. Tap a task to comment on it.</InfoBanner>
                <WeeklyPlan company={company} categories={categories} branches={activeBranches.filter(b => managerBranches.includes(b.id))} profile={profile} readOnly />
              </>
            )}
            {amPage==="campaign" && <AreaManagerCampaignGuides campaign={campaign} campaignProgress={campaignProgress} branches={activeBranches} managerBranches={managerBranches} profile={profile} guidelines={guidelines} company={company} onUploadGuideline={handleUploadGuideline} onDeleteGuideline={handleDeleteGuideline} onReviewBranchFile={handleReviewCampaignBranchFile} />}
            {amPage==="training" && <Training company={company} profile={profile} branches={activeBranches} />}
            {amPage==="visits"   && <StoreVisits company={company} branches={activeBranches.filter(b => managerBranches.includes(b.id))} profile={profile} visits={visits} floorWalks={floorWalks} onVisitCreated={() => loadVisits(company.id)} onDeleteVisit={handleDeleteVisit} onFloorWalkChanged={handleFloorWalkChanged} onDeleteFloorWalk={handleDeleteFloorWalk} />}
            {amPage==="chat"     && <Chat user={profile} onSend={(room, body, attachment) => sendMessage(company.id, profile.id, room, body, attachment)} companyId={company.id} branches={activeBranches} />}
          </div>
          <nav style={S.bottomNav}>
            {[["overview",OverviewIcon,"Overview"],["requests",RequestsIcon,"Requests"],["plan",CalendarIcon,"Plan"],["campaign",GuidesIcon,"Campaign"],["training",AnalyticsIcon,"Training"],["visits",VisitsIcon,"Visits"],["chat",ChatIcon,"Chat"]].map(([k,Icon,lbl]) => (
              <button key={k} className="tab-btn" style={S.navBtn(amPage===k)} onClick={() => setAmPage(k)}>
                <Icon size={22} /><span>{lbl}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {isManager && (
        <div style={S.app}><StyleTag />
          <TopBar user={profile} onLogout={() => signOut()} isSuperAdmin={isSuperAdmin} onSuperAdmin={() => setMgrPage("superadmin")} />
          <div key={mgrPage} className="page-transition" style={S.main}>
            {mgrPage==="overview"   && <MgrOverview tasks={tasks} submissions={submissions} log={log} company={company} branches={activeBranches} campaign={campaign} promotions={promotions} onCreatePromotion={handleCreatePromotion} onDeletePromotion={handleDeletePromotion} profile={profile} />}
            {mgrPage==="assign"     && <MgrAssign tasks={tasks} submissions={submissions} categories={categories} branches={activeBranches} company={company} profile={profile} />}
            {mgrPage==="training"   && <Training company={company} profile={profile} branches={activeBranches} />}
            {mgrPage==="campaign"   && <CampaignGuidesPage company={company} guidelines={guidelines} onUploadGuideline={handleUploadGuideline} onDeleteGuideline={handleDeleteGuideline} campaign={campaign} onSaveCampaign={handleSaveCampaign} onDeleteCampaign={handleDeleteCampaign} campaignProgress={campaignProgress} onSetBranchStatus={handleSetBranchStatus} campaignAck={campaignAck} onAcknowledgeCampaign={handleAcknowledgeCampaign} onReviewBranchFile={handleReviewCampaignBranchFile} profile={profile} />}
            {mgrPage==="reports"    && <MgrReports tasks={tasks} submissions={submissions} onExportPDF={handleExportPDF} />}
            {mgrPage==="visits"     && <StoreVisits company={company} branches={activeBranches} profile={profile} visits={visits} floorWalks={floorWalks} onFloorWalkChanged={handleFloorWalkChanged} canCreateFloorWalk={false} canCreateVisit={false} />}
            {mgrPage==="chat"       && <Chat user={profile} onSend={(room, body, attachment) => sendMessage(company.id, profile.id, room, body, attachment)} companyId={company.id} branches={activeBranches} />}
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

  if (loading) return <LoadingScreen />;

  if (!session?.profile) return (
    <>
      <ToastContainer />
      <LoginScreen />
    </>
  );

  return (
    <>
      <ToastContainer />
      <AuthenticatedApp />
    </>
  );
}