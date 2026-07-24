import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { WeeklyPlan } from "./WeeklyPlan.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";

// ============================================================
//  VM CONTROLLER — create tasks + weekly plan, own branch only
// ============================================================
export function StoreManagerAssign({ tasks, categories, branches, profile, company, onCreateTask, onDeleteTask }) {
  const [tab,        setTab]        = useState("add");
  const [catId,      setCatId]      = useState(categories[0]?.id ?? "");
  const [subId,      setSubId]      = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [assignedTo, setAssignedTo] = useState("all");
  const [text,       setText]       = useState("");
  const [priority,   setPriority]   = useState("medium");
  const [dueDate,    setDueDate]    = useState("Today");
  const [saving,     setSaving]     = useState(false);
  const [staff,      setStaff]      = useState([]);
  const [openTaskId, setOpenTaskId] = useState(null);

  const myBranch  = branches.find(b => b.id === profile.branch_id);
  const activeCat  = categories.find(c => c.id === catId);
  const activeSubs = activeCat?.subcategories ?? [];

  useEffect(() => {
    if (!company?.id || !profile?.branch_id) return;
    supabase.from("profiles").select("id, full_name")
      .eq("company_id", company.id).eq("branch_id", profile.branch_id)
      .eq("role", "vm")
      .then(({ data }) => setStaff(data ?? []));
  }, [company?.id, profile?.branch_id]);

  const changeCat = (id) => {
    setCatId(id);
    setSubId(categories.find(c => c.id === id)?.subcategories?.[0]?.id ?? "");
  };

  const addTask = async () => {
    if (!text.trim() || !profile.branch_id) return;
    setSaving(true);
    try {
      await onCreateTask({
        category_id: catId || null, subcategory_id: subId || null,
        branch_id: profile.branch_id, target_controller_id: profile.id,
        title: text, priority, due_label: dueDate, assigned_to: assignedTo,
      });
      setText("");
    } finally { setSaving(false); }
  };

  const assignedName = assignedTo === "all" ? "All Staff"
    : staff.find(s => s.id === assignedTo)?.full_name ?? "—";

  const myTasks = tasks.filter(t => t.branch_id === profile.branch_id);

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Branch <span style={S.accent}>Tasks</span>
      </div>
      {myBranch && <div style={{ ...S.muted, fontSize:12, marginBottom:14 }}>📍 {myBranch.name}</div>}

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["plan","📅 Weekly Plan"],["add","＋ New Task"],["all","All Tasks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "plan" && myBranch && (
        <WeeklyPlan company={company} categories={categories} branches={[myBranch]} profile={profile} />
      )}

      {tab === "add" && (
        <div style={S.card}>
          <div style={S.h3}>Assign To</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
            <button className="pill-btn" onClick={() => setAssignedTo("all")} style={{
              padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
              background:assignedTo==="all"?C.accentColor+"28":"transparent",
              color:assignedTo==="all"?C.accentColor:C.mutedColor,
              border:assignedTo==="all"?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
            }}>👥 All Staff</button>
            {staff.map(s => (
              <button key={s.id} className="pill-btn" onClick={() => setAssignedTo(s.id)} style={{
                padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background:assignedTo===s.id?C.accentColor+"28":"transparent",
                color:assignedTo===s.id?C.accentColor:C.mutedColor,
                border:assignedTo===s.id?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
              }}>👤 {s.full_name}</button>
            ))}
          </div>
          <div style={S.h3}>Category</div>
          <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
            {categories.map(c => (
              <button key={c.id} className="pill-btn" onClick={() => changeCat(c.id)} style={{
                padding:"7px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background:catId===c.id?C.accentColor+"28":"transparent",
                color:catId===c.id?C.accentColor:C.mutedColor,
                border:catId===c.id?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
              }}>{c.name}</button>
            ))}
          </div>
          {activeSubs.length > 0 && (
            <>
              <div style={S.lbl}>Section</div>
              <select style={S.sel} value={subId} onChange={e => setSubId(e.target.value)}>
                {activeSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={S.lbl}>Priority</div>
              <select style={S.sel} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <div style={S.lbl}>Due</div>
              <select style={S.sel} value={dueDate} onChange={e => setDueDate(e.target.value)}>
                <option>Today</option><option>Tomorrow</option>
                <option>This week</option><option>Next week</option>
              </select>
            </div>
          </div>
          <div style={S.lbl}>Task Description</div>
          <textarea style={{ ...S.inp, minHeight:76, resize:"vertical" }}
            placeholder="Describe the task clearly…" value={text} onChange={e => setText(e.target.value)}/>
          {text && (
            <div style={{ padding:"10px 12px", background:C.surfaceHigh, borderRadius:8,
              fontSize:12, color:C.mutedColor, marginBottom:12 }}>
              Assigning to: <strong style={{ color:C.accentColor }}>{assignedName}</strong>
              {myBranch && <> · 📍 {myBranch.name}</>} · Reviewed by you
            </div>
          )}
          <button className="btnP" style={{ ...S.btnP, width:"100%" }}
            onClick={addTask} disabled={saving}>
            {saving ? "Saving…" : `Assign to ${assignedName} →`}
          </button>
        </div>
      )}

      {tab === "all" && (
        <div>
          {myTasks.length === 0 && <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No tasks yet.</div>}
          {myTasks.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:C.accentColor, fontWeight:600, marginBottom:4 }}>
                    {t.category?.name ?? "—"} · {t.subcategory?.name ?? "—"}
                  </div>
                  <div style={{ fontSize:13, color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                    textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                    {t.title ?? t.text}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                    <span style={S.chip(t.priority)}>{t.priority}</span>
                    <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                    {t.assigned_to && t.assigned_to !== "all" && (
                      <span style={{ fontSize:11, color:"#818cf8" }}>
                        👤 {staff.find(s=>s.id===t.assigned_to)?.full_name ?? t.assigned_to}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:8 }}>
                  <span style={S.chip((t.is_done||t.done)?"approved":"pending")}>
                    {(t.is_done||t.done)?"Done":"Open"}
                  </span>
                  <button style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:15 }}
                    onClick={() => onDeleteTask(t.id)}>✕</button>
                </div>
              </div>
              <button onClick={() => setOpenTaskId(openTaskId === t.id ? null : t.id)}
                style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                  fontSize:11, fontWeight:600, padding:0, marginTop:8 }}>
                {openTaskId === t.id ? "Hide comments" : "💬 Comments"}
              </button>
              {openTaskId === t.id && <CommentThread taskId={t.id} profile={profile} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
