import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { notifyUser } from "../../services/enterprise.service.js";
import { toast } from "../shared/Toast.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { printWeeklyPlanChecklist } from "../../lib/checklistReports.js";

// ============================================================
//  WEEKLY STORE PLAN — Table View
//  One employee at a time · free week navigation · row-per-task
// ============================================================

const STATUS_META = {
  pending:     { bg:"#6b688018", color:"#6b6880", label:"Scheduled" },
  in_progress: { bg:"#d4a82a18", color:"#d4a82a", label:"In Progress" },
  done:        { bg:"#4ade8018", color:"#4ade80", label:"Done" },
};

// Gulf work week: Saturday → Friday
const DAY_LABELS = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];

const getWeekDates = (weekStartStr) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartStr);
    d.setDate(d.getDate() + i);
    return {
      index: i,
      label: DAY_LABELS[i],
      date:  d.toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }),
      dmy:   d.toLocaleDateString("en-GB", { day:"2-digit", month:"2-digit", year:"numeric" }),
    };
  });
};

const getWeekStart = (offset = 0) => {
  const d = new Date();
  const day = d.getDay(); // Sun=0 .. Sat=6
  const daysSinceSat = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSat + offset * 7);
  return d.toISOString().slice(0, 10);
};

// Saturday of the week containing an arbitrary date (for the open date picker)
const getWeekStartOf = (dateStr) => {
  const d = new Date(dateStr);
  const day = d.getDay();
  const daysSinceSat = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSat);
  return d.toISOString().slice(0, 10);
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDueLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const PRIORITY_COLOR = { high: "#f87171", medium: "#d4a82a", low: "#4ade80" };

// Supabase/PostgREST sometimes returns a to-one embed as a single-element
// array instead of an object (depends on how it infers the relationship) —
// normalize so `.name`/`.icon`/`.priority` access always works.
const one = (x) => Array.isArray(x) ? x[0] : x;

// One self-contained, compact staff × day grid for a single branch —
// used to render each branch as its own organized, collapsible section for
// Head VM / VM Manager. Collapsed by default and only fetches its data once
// expanded, so this stays cheap even with 30+ branches.
function BranchWeekGrid({ company, branchId, branchName, weekStart, weekDates, profile }) {
  const [expanded, setExpanded] = useState(false);
  const [staff,    setStaff]    = useState([]);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [openItemId, setOpenItemId] = useState(null);

  useEffect(() => {
    if (!expanded || !company?.id || !branchId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [{ data: staffData }, { data: plan }] = await Promise.all([
        supabase.from("profiles").select("id, full_name")
          .eq("company_id", company.id).eq("branch_id", branchId).in("role", ["vm", "store_manager"]),
        supabase.from("weekly_plans").select("id")
          .eq("company_id", company.id).eq("branch_id", branchId).eq("week_start", weekStart).maybeSingle(),
      ]);
      if (cancelled) return;
      setStaff(staffData ?? []);
      if (!plan) { setItems([]); setLoading(false); setLoaded(true); return; }
      const { data: itemsData } = await supabase
        .from("weekly_plan_items")
        .select("*, assigned_staff:assigned_staff_id(id, full_name), category:categories(name, icon), task:task_id(priority)")
        .eq("plan_id", plan.id);
      if (cancelled) return;
      setItems((itemsData ?? []).map(i => ({ ...i, category: one(i.category), assigned_staff: one(i.assigned_staff), task: one(i.task) })));
      setLoading(false);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [expanded, company?.id, branchId, weekStart]);

  const totalThisWeek = items.length;

  return (
    <div>
      <button onClick={() => setExpanded(p => !p)} style={{
        width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
        background:"none", border:"none", cursor:"pointer", padding:"8px 2px", textAlign:"left",
      }}>
        <div style={S.h3}>📍 {branchName}{loaded && ` · ${totalThisWeek} task${totalThisWeek===1?"":"s"}`}</div>
        <span style={{ color:C.mutedColor, fontSize:12 }}>{expanded ? "▲ Hide" : "▼ Show"}</span>
      </button>
      {!expanded ? null : loading ? (
        <div style={{ ...S.muted, fontSize:12, padding:"10px 0" }}>Loading…</div>
      ) : staff.length === 0 ? (
        <div style={{ ...S.muted, fontSize:12, padding:"10px 0" }}>No staff at this branch.</div>
      ) : (
        <div style={{ ...S.card, padding:0, overflow:"hidden", border:`1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)` }}>
          <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", minWidth:640, tableLayout:"fixed", borderCollapse:"collapse", fontSize:11 }}>
            <colgroup>
              <col style={{ width:"15%" }} />
              {weekDates.map(d => <col key={d.index} />)}
            </colgroup>
            <thead>
              <tr>
                {["Employee", ...weekDates.map(d => `${d.label.slice(0,3)} ${d.dmy.slice(0,5)}`)].map((h, i, arr) => (
                  <th key={h} style={{
                    padding:"6px 4px", textAlign:"left", fontSize:9, fontWeight:800,
                    color:C.accentColor, letterSpacing:.2, textTransform:"uppercase",
                    background:C.surfaceHigh, borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)`,
                    borderRight: i < arr.length-1 ? `1px solid color-mix(in srgb, var(--clr-text) 16%, transparent)` : "none",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((s, si) => {
                const rowBg = si % 2 === 0 ? "transparent" : C.surfaceHigh;
                const cellBorder = `1px solid color-mix(in srgb, var(--clr-text) 9%, transparent)`;
                return (
                  <tr key={s.id}>
                    <td style={{
                      padding:"6px 4px", fontSize:10, fontWeight:700, wordBreak:"break-word",
                      borderBottom:cellBorder, borderRight:cellBorder, background: si%2===0 ? C.surfaceColor : C.surfaceHigh,
                    }}>{s.full_name}</td>
                    {weekDates.map(d => {
                      const dayItems = items.filter(i =>
                        (i.assigned_staff_id === s.id || i.assigned_staff?.id === s.id) && i.day_of_week === d.index
                      );
                      return (
                        <td key={d.index} style={{ padding:"4px 3px", verticalAlign:"top", borderBottom:cellBorder, borderRight:cellBorder, background:rowBg }}>
                          {dayItems.length === 0 ? (
                            <span style={{ color:C.mutedColor, fontSize:10 }}>—</span>
                          ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                              {dayItems.map(item => {
                                const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                                const prio = PRIORITY_COLOR[item.task?.priority] ?? PRIORITY_COLOR.medium;
                                const [title] = (item.title ?? "").split("\n");
                                const isDayOff = title.trim().toLowerCase() === "day off";
                                return (
                                  <div key={item.id}
                                    onClick={() => !isDayOff && item.task_id && setOpenItemId(p => p === item.id ? null : item.id)}
                                    style={{
                                    padding:"2px 4px", borderRadius:5,
                                    background: openItemId === item.id ? meta.bg.replace("18","33") : isDayOff ? C.mutedColor+"18" : meta.bg,
                                    borderLeft: isDayOff ? `3px solid ${C.mutedColor}` : `3px solid ${prio}`,
                                    lineHeight:1.25, wordBreak:"break-word",
                                    cursor: !isDayOff && item.task_id ? "pointer" : "default",
                                  }}>
                                    {!isDayOff && item.category?.name && (
                                      <div style={{ fontSize:8, fontWeight:800, color:"#818cf8", letterSpacing:.2, textTransform:"uppercase" }}>
                                        {item.category.name}
                                      </div>
                                    )}
                                    <div style={{ fontSize:9, fontWeight:600,
                                      color: isDayOff ? C.mutedColor : item.status==="done" ? C.mutedColor : C.textColor,
                                      textDecoration: item.status==="done" ? "line-through" : "none" }}>
                                      {isDayOff ? "Day Off" : title}
                                    </div>
                                    {!isDayOff && (
                                      <div style={{ fontSize:8, fontWeight:700, color:meta.color, marginTop:1 }}>{meta.label}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
      {openItemId && (() => {
        const openItem = items.find(i => i.id === openItemId);
        return openItem?.task_id ? (
          <div style={{ marginTop:10 }}>
            <div style={{ ...S.muted, fontSize:11, marginBottom:4 }}>💬 Comments — {openItem.title?.split("\n")[0]}</div>
            <CommentThread taskId={openItem.task_id} profile={profile} />
          </div>
        ) : null;
      })()}
    </div>
  );
}

export function WeeklyPlan({ company, categories, branches, profile, readOnly = false, lockedStaffId = null, statusEditable = !readOnly, weekNav = !readOnly, onTasksChanged, onItemClick }) {
  const [weekOffset,     setWeekOffset]     = useState(0);
  const [activePlan,     setActivePlan]     = useState(null);
  const [items,          setItems]          = useState([]);
  const [staff,          setStaff]          = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? "");
  const [selectedStaff,  setSelectedStaff]  = useState(lockedStaffId ?? "");
  const [creating,       setCreating]       = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [copyMsg,        setCopyMsg]        = useState("");

  // Add task modal
  const [showAdd,    setShowAdd]    = useState(false);
  const [addDate,    setAddDate]    = useState(todayStr());
  const [addTitle,   setAddTitle]   = useState("");
  const [addNotes,   setAddNotes]   = useState("");
  const [addCat,     setAddCat]     = useState("");
  const [saving,     setSaving]     = useState(false);

  const weekStart = getWeekStart(weekOffset);
  const weekDates = getWeekDates(weekStart);
  const todayIndex = weekOffset === 0 ? (new Date().getDay() + 1) % 7 : -1;

  useEffect(() => {
    if (!company || !selectedBranch) return;
    supabase.from("profiles")
      .select("id, full_name, role, avatar_initials")
      .eq("company_id", company.id)
      .eq("branch_id", selectedBranch)
      .in("role", ["vm", "store_manager"])
      .then(({ data }) => {
        setStaff(data ?? []);
        if (lockedStaffId) { setSelectedStaff(lockedStaffId); return; }
        if (data?.length && !data.some(s => s.id === selectedStaff)) setSelectedStaff(data[0].id);
      });
  }, [company?.id, selectedBranch]);

  useEffect(() => {
    if (!selectedBranch || !company) return;
    loadPlan();
  }, [selectedBranch, company?.id, weekOffset]);

  const loadPlan = async () => {
    setLoading(true);
    const { data: plan } = await supabase
      .from("weekly_plans")
      .select("*")
      .eq("company_id", company.id)
      .eq("branch_id", selectedBranch)
      .eq("week_start", weekStart)
      .single();

    if (plan) {
      setActivePlan(plan);
      await loadItems(plan.id);
    } else {
      setActivePlan(null);
      setItems([]);
    }
    setLoading(false);
  };

  const loadItems = async (plan_id) => {
    const { data } = await supabase
      .from("weekly_plan_items")
      .select("*, category:categories(name, icon), assigned_staff:assigned_staff_id(id, full_name)")
      .eq("plan_id", plan_id)
      .order("day_of_week").order("sort_order");
    setItems((data ?? []).map(i => ({ ...i, category: one(i.category), assigned_staff: one(i.assigned_staff) })));
  };

  const ensurePlan = async () => ensurePlanFor(weekStart);

  // Find-or-create a plan for an arbitrary week (used when adding a task on a
  // date outside the currently displayed week via the open date picker).
  const ensurePlanFor = async (targetWeekStart) => {
    if (targetWeekStart === weekStart && activePlan) return activePlan;
    const { data: existing } = await supabase
      .from("weekly_plans").select("*")
      .eq("company_id", company.id).eq("branch_id", selectedBranch)
      .eq("week_start", targetWeekStart).maybeSingle();
    if (existing) { if (targetWeekStart === weekStart) setActivePlan(existing); return existing; }
    setCreating(true);
    const { data } = await supabase
      .from("weekly_plans")
      .insert({ company_id: company.id, branch_id: selectedBranch,
        created_by: profile.id, week_start: targetWeekStart })
      .select().single();
    setCreating(false);
    if (data && targetWeekStart === weekStart) setActivePlan(data);
    return data;
  };

  const copyLastWeek = async () => {
    setCopyMsg("");
    const lastWeekStart = getWeekStart(weekOffset - 1);
    const { data: lastPlan } = await supabase
      .from("weekly_plans").select("id")
      .eq("company_id", company.id).eq("branch_id", selectedBranch)
      .eq("week_start", lastWeekStart).single();
    if (!lastPlan) { setCopyMsg("No plan found for the previous week."); return; }
    const { data: lastItems } = await supabase
      .from("weekly_plan_items").select("*").eq("plan_id", lastPlan.id);
    if (!lastItems?.length) { setCopyMsg("Previous week's plan is empty."); return; }
    setCreating(true);
    const plan = await ensurePlan();
    if (plan) {
      // Fresh `tasks` row per item — last week's task (already reviewed/submitted) must not be reused.
      for (const i of lastItems) {
        const itemDate = new Date(weekStart);
        itemDate.setDate(itemDate.getDate() + i.day_of_week);
        const itemDateStr = itemDate.toISOString().slice(0, 10);
        const { data: task } = await supabase
          .from("tasks")
          .insert({
            company_id: company.id, branch_id: selectedBranch,
            category_id: i.category_id, created_by: profile.id,
            assigned_to: i.assigned_staff_id, target_controller_id: profile.id,
            title: (i.title ?? "").split("\n")[0], priority: "medium",
            due_date: itemDateStr, due_label: formatDueLabel(itemDateStr),
          })
          .select().single();
        await supabase.from("weekly_plan_items").insert({
          ...i, id: undefined, plan_id: plan.id, task_id: task?.id ?? null, status: "pending",
        });
        if (task?.id) notifyUser(company.id, i.assigned_staff_id, "task_created", "New Task Assigned 📋", (i.title ?? "").split("\n")[0]);
      }
      await loadItems(plan.id);
      onTasksChanged?.();
    }
    setCreating(false);
  };

  const openAdd = (dayIndex, presetTitle = "") => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    setAddDate(d.toISOString().slice(0, 10));
    setAddTitle(presetTitle); setAddNotes(""); setAddCat("");
    setShowAdd(true);
  };

  const addItem = async () => {
    if (!addTitle.trim() || !selectedStaff || !addDate) return;
    setSaving(true);
    try {
      const targetMonday = getWeekStartOf(addDate);
      const dayOfWeek = Math.round((new Date(addDate) - new Date(targetMonday)) / 86400000);
      const plan = await ensurePlanFor(targetMonday);
      if (!plan) { toast("Failed to create task. Please try again."); return; }
      const catId = addCat === "DAYOFF" ? null : (addCat || null);

      // The plan item IS the task: create the backing `tasks` row so the VM
      // sees it in My Tasks / Submit Work with before/after + approval flow.
      const { data: task, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          company_id: company.id, branch_id: selectedBranch,
          category_id: catId, created_by: profile.id,
          assigned_to: selectedStaff, target_controller_id: profile.id,
          title: addTitle, priority: "medium",
          due_date: addDate, due_label: formatDueLabel(addDate),
        })
        .select().single();
      if (taskErr) throw taskErr;

      const { data, error: itemErr } = await supabase
        .from("weekly_plan_items")
        .insert({
          plan_id:           plan.id,
          task_id:           task?.id ?? null,
          title:             addCat === "DAYOFF" ? addTitle : (addNotes.trim() ? `${addTitle}\n${addNotes.trim()}` : addTitle),
          category_id:       catId,
          day_of_week:       dayOfWeek,
          assigned_staff_id: selectedStaff,
          sort_order:        items.length,
        })
        .select("*, category:categories(name, icon), assigned_staff:assigned_staff_id(id, full_name)")
        .single();
      if (itemErr) throw itemErr;

      // If the chosen date falls outside the week currently on screen, jump the
      // view to that week so the new item is visible right away.
      if (targetMonday !== weekStart) {
        const newOffset = Math.round((new Date(targetMonday) - new Date(getWeekStart(0))) / (7 * 86400000));
        setWeekOffset(newOffset);
        setShowAdd(false);
        if (task?.id) notifyUser(company.id, selectedStaff, "task_created", "New Task Assigned 📋", addTitle);
        onTasksChanged?.();
        return;
      }
      if (data) setItems(p => [...p, { ...data, category: one(data.category), assigned_staff: one(data.assigned_staff) }]);
      setShowAdd(false);
      if (task?.id) notifyUser(company.id, selectedStaff, "task_created", "New Task Assigned 📋", addTitle);
      onTasksChanged?.();
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to create task. Please try again.");
    } finally { setSaving(false); }
  };

  const cycleStatus = async (item) => {
    const next = item.status === "pending" ? "in_progress"
      : item.status === "in_progress" ? "done" : "pending";
    try {
      const { error } = await supabase.from("weekly_plan_items").update({ status: next }).eq("id", item.id);
      if (error) throw error;
      setItems(p => p.map(i => i.id === item.id ? { ...i, status: next } : i));
      if (item.task_id) {
        await supabase.from("tasks").update({ is_done: next === "done" }).eq("id", item.task_id);
        onTasksChanged?.();
      }
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to update status. Please try again.");
    }
  };

  const deleteItem = async (item) => {
    try {
      const { error } = await supabase.from("weekly_plan_items").delete().eq("id", item.id);
      if (error) throw error;
      setItems(p => p.filter(i => i.id !== item.id));
      if (item.task_id) {
        await supabase.from("tasks").delete().eq("id", item.task_id);
        onTasksChanged?.();
      }
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to delete. Please try again.");
    }
  };

  const myItems = items
    .filter(i => !selectedStaff || i.assigned_staff_id === selectedStaff || i.assigned_staff?.id === selectedStaff)
    .sort((a, b) => a.day_of_week - b.day_of_week);

  const selectedStaffObj = staff.find(s => s.id === selectedStaff);

  // Head VM / VM Manager: one combined grid — every employee at once, no switching.
  const combinedView = readOnly && !lockedStaffId;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10, marginBottom:16 }} className="fu">
        <div>
          <div style={{ ...S.h1, marginBottom:2 }}>Weekly <span style={S.accent}>Store Plan</span></div>
          <div style={{ ...S.muted, fontSize:12 }}>Create and assign weekly tasks for your team</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {weekNav && (
            <button className="btnG" style={{ ...S.btnG, padding:"7px 10px" }} onClick={() => setWeekOffset(o => o - 1)}>‹</button>
          )}
          <div style={{ padding:"7px 14px", borderRadius:10, background:C.surfaceHigh, fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
            📅 {weekNav ? `${weekDates[0].date} — ${weekDates[6].date}` : new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"short", year:"numeric" })}
          </div>
          {weekNav && (
            <button className="btnG" style={{ ...S.btnG, padding:"7px 10px" }} onClick={() => setWeekOffset(o => o + 1)}>›</button>
          )}
          {weekNav && weekOffset !== 0 && (
            <button className="btnG" style={{ ...S.btnG, fontSize:11, padding:"7px 10px" }} onClick={() => setWeekOffset(0)}>This Week</button>
          )}
        </div>
      </div>

      {/* Branch selector */}
      {!combinedView && branches.length > 1 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
          {branches.map(b => (
            <button key={b.id} className="pill-btn" onClick={() => setSelectedBranch(b.id)} style={{
              padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
              background: selectedBranch===b.id ? C.accentColor+"28" : "transparent",
              color:      selectedBranch===b.id ? C.accentColor : C.mutedColor,
              border:     selectedBranch===b.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
            }}>{b.name}</button>
          ))}
        </div>
      )}

      {/* Employee selector + Total Tasks + Add Task */}
      {!combinedView && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center", marginBottom:16 }}>
          <div style={{ ...S.card, marginBottom:0, display:"flex", alignItems:"center", gap:10, padding:"10px 16px", flex:"1 1 260px" }}>
            <div style={{ ...S.avatar(34) }}>{selectedStaffObj?.full_name?.split(" ").map(x=>x[0]).join("").slice(0,2) ?? "—"}</div>
            {lockedStaffId ? (
              <div style={{ fontSize:14, fontWeight:700 }}>{selectedStaffObj?.full_name ?? "My Plan"}</div>
            ) : (
              <select style={{ background:"none", border:"none", color:C.textColor, fontSize:14, fontWeight:700,
                fontFamily:"'DM Sans',sans-serif", flex:1, cursor:"pointer" }}
                value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                {staff.length === 0 && <option value="">No staff at this branch</option>}
                {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            )}
          </div>
          <div style={{ ...S.card, marginBottom:0, padding:"10px 16px", textAlign:"center" }}>
            <div style={{ ...S.dFont, fontSize:20, fontWeight:700, color:C.accentColor, lineHeight:1 }}>{myItems.length}</div>
            <div style={{ fontSize:10, color:C.mutedColor, marginTop:2 }}>Total Tasks This Week</div>
          </div>
          {!readOnly && (
            <>
              <button className="btnG" style={S.btnG} onClick={copyLastWeek} disabled={creating || !selectedBranch}>
                📋 Copy Last Week
              </button>
              <button className="btnP" style={S.btnP} onClick={() => openAdd(weekDates[0].index)} disabled={!selectedStaff}>
                ＋ Add Task
              </button>
              {todayIndex >= 0 && (
                <button className="btnG" style={S.btnG} onClick={() => printWeeklyPlanChecklist({
                  branchName: branches.find(b => b.id === selectedBranch)?.name ?? "Branch",
                  dayLabel: weekDates[todayIndex].label,
                  dayDate: weekDates[todayIndex].date,
                  staffGroups: staff.map(s => ({
                    name: s.full_name,
                    items: items.filter(i => (i.assigned_staff_id === s.id || i.assigned_staff?.id === s.id) && i.day_of_week === todayIndex)
                      .map(i => ({ title: (i.title ?? "").split("\n")[0], status: i.status })),
                  })),
                  company,
                })}>
                  🖨️ Print Today
                </button>
              )}
            </>
          )}
        </div>
      )}
      {copyMsg && <div style={{ ...S.muted, fontSize:12, marginBottom:10 }}>{copyMsg}</div>}

      {/* Combined grid — Head VM / VM Manager see every branch as its own organized section */}
      {combinedView ? (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {branches.map(b => (
            <BranchWeekGrid key={b.id} company={company} branchId={b.id} branchName={b.name} weekStart={weekStart} weekDates={weekDates} profile={profile} />
          ))}
        </div>
      ) : loading ? (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>Loading…</div>
      ) : !selectedStaff ? (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>👤</div>
          <div style={{ ...S.muted }}>No staff assigned to this branch yet.</div>
        </div>
      ) : (
        <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
          {[
            { n: myItems.length, l:"Total This Week", c:C.accentColor },
            { n: myItems.filter(i => i.status==="done").length, l:"Done", c:"#4ade80" },
            { n: myItems.filter(i => i.day_of_week===todayIndex).length, l:"Today", c:"#d4a82a" },
          ].map(k => (
            <div key={k.l} style={{ textAlign:"center", padding:"10px 6px", background:C.surfaceHigh, borderRadius:10 }}>
              <div style={{ fontSize:18, fontWeight:800, color:k.c, lineHeight:1 }}>{k.n}</div>
              <div style={{ fontSize:9, fontWeight:700, color:C.mutedColor, letterSpacing:.5, textTransform:"uppercase", marginTop:3 }}>{k.l}</div>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
              <thead>
                <tr>
                  {["Day","Date","Task","Status","Notes / Details", ...(readOnly ? [] : ["Actions"])].map(h => (
                    <th key={h} style={{
                      padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700,
                      color:C.mutedColor, letterSpacing:1, textTransform:"uppercase",
                      background:C.surfaceHigh, borderBottom:`1px solid ${C.accentColor}18`,
                      whiteSpace:"nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekDates.map(d => {
                  const dayItems = myItems.filter(i => i.day_of_week === d.index);
                  if (dayItems.length === 0) {
                    return (
                      <tr key={d.index}>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, borderBottom:`1px solid ${C.accentColor}0a` }}>{d.label}</td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor, borderBottom:`1px solid ${C.accentColor}0a` }}>{d.dmy}</td>
                        <td colSpan={readOnly ? 3 : 2} style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor+"88", borderBottom:`1px solid ${C.accentColor}0a` }}>No task scheduled</td>
                        {!readOnly && (
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                            <button onClick={() => openAdd(d.index)} style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:12, fontWeight:600 }}>＋ Add</button>
                          </td>
                        )}
                      </tr>
                    );
                  }
                  return dayItems.map((item, i) => {
                    const meta = STATUS_META[item.status] ?? STATUS_META.pending;
                    const [title, ...noteLines] = (item.title ?? "").split("\n");
                    const clickable = onItemClick && item.task_id && d.index === todayIndex;
                    return (
                      <tr key={item.id}>
                        {i === 0 && (
                          <>
                            <td rowSpan={dayItems.length} style={{ padding:"12px 16px", fontSize:13, fontWeight:600, verticalAlign:"top", borderBottom:`1px solid ${C.accentColor}0a` }}>{d.label}</td>
                            <td rowSpan={dayItems.length} style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor, verticalAlign:"top", borderBottom:`1px solid ${C.accentColor}0a` }}>{d.dmy}</td>
                          </>
                        )}
                        <td onClick={clickable ? () => onItemClick(item) : undefined}
                          style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a`, maxWidth:260, cursor: clickable ? "pointer" : "default" }}>
                          {item.category?.name && (
                            <div style={{ fontSize:10, fontWeight:800, color:"#818cf8", letterSpacing:.3, textTransform:"uppercase", marginBottom:2 }}>
                              {item.category.name}
                            </div>
                          )}
                          <div style={{ fontSize:13, fontWeight:600, color: item.status==="done" ? C.mutedColor : C.textColor,
                            textDecoration: item.status==="done" ? "line-through" : "none" }}>
                            {title}{clickable && <span style={{ color:C.accentColor, fontWeight:700 }}> · 📤 Tap to submit</span>}
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                          {statusEditable ? (
                            <button onClick={() => cycleStatus(item)} style={{
                              padding:"4px 12px", borderRadius:14, fontSize:11, fontWeight:700, cursor:"pointer",
                              background:meta.bg, color:meta.color, border:`1px solid ${meta.color}33`,
                            }}>{meta.label}</button>
                          ) : (
                            <span style={{
                              padding:"4px 12px", borderRadius:14, fontSize:11, fontWeight:700,
                              background:meta.bg, color:meta.color, border:`1px solid ${meta.color}33`,
                            }}>{meta.label}</span>
                          )}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:12, color:C.mutedColor, borderBottom:`1px solid ${C.accentColor}0a`, maxWidth:220 }}>
                          {noteLines.join(" ") || "—"}
                        </td>
                        {!readOnly && (
                          <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.accentColor}0a` }}>
                            <button onClick={() => deleteItem(item)}
                              style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:15 }}>⋮</button>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
          {statusEditable && (
            <div style={{ padding:"10px 16px", fontSize:11, color:C.mutedColor, borderTop:`1px solid ${C.accentColor}0a` }}>
              ℹ️ Tap a status pill to cycle Scheduled → In Progress → Done
            </div>
          )}
        </div>
        </>
      )}

      {/* Add Task modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"#00000088", zIndex:600,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"var(--clr-surface)", borderRadius:20, padding:26,
            width:"100%", maxWidth:420, border:`1px solid ${C.accentColor}33` }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>＋ Add Task</div>
            <div style={S.lbl}>Date</div>
            <input style={S.inp} type="date" value={addDate} onChange={e => setAddDate(e.target.value)} />
            <div style={S.lbl}>Category</div>
            <select style={S.sel} value={addCat} onChange={e => {
              setAddCat(e.target.value);
              if (e.target.value === "DAYOFF") setAddTitle("Day Off");
              else if (addTitle === "Day Off") setAddTitle("");
            }}>
              <option value="">— optional —</option>
              <option value="DAYOFF">Day Off</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {addCat !== "DAYOFF" && (
              <>
                <div style={S.lbl}>Quick Select</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {["Remerchandise","Refresh","New Implementation"].map(p => (
                    <button key={p} type="button" onClick={() => setAddTitle(p)} style={{
                      padding:"6px 12px", borderRadius:16, cursor:"pointer", fontSize:12, fontWeight:600,
                      background: addTitle===p ? C.accentColor+"28" : "transparent",
                      color:      addTitle===p ? C.accentColor : C.mutedColor,
                      border:     addTitle===p ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
                    }}>{p}</button>
                  ))}
                </div>
              </>
            )}

            <div style={S.lbl}>Task</div>
            <input style={S.inp} placeholder="e.g. Update window display"
              value={addTitle} onChange={e => setAddTitle(e.target.value)}
              disabled={addCat === "DAYOFF"} autoFocus />

            {addCat !== "DAYOFF" && (
              <>
                <div style={S.lbl}>Notes / Details</div>
                <textarea style={{ ...S.inp, minHeight:64, resize:"vertical" }}
                  placeholder="Extra instructions…" value={addNotes} onChange={e => setAddNotes(e.target.value)} />
              </>
            )}
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button className="btnP" style={{ ...S.btnP, flex:1 }} onClick={addItem} disabled={saving || !addTitle.trim()}>
                {saving ? "Saving…" : "Add Task →"}
              </button>
              <button className="btnG" style={S.btnG} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
