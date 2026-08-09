import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { ImageUploader } from "../shared/Atoms.jsx";
import { Training } from "../manager/Training.jsx";
import { WeeklyPlan } from "../manager/WeeklyPlan.jsx";

export function VMTasks({ user, categories, branches, tasks, onSubmit, onTaskToggle,
  company, profile }) {

  const [tab,      setTab]      = useState("plan");
  const [catId,    setCatId]    = useState(categories[0]?.id ?? "");
  const [subId,    setSubId]    = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [branchId, setBranchId] = useState(user?.branch_id ?? branches[0]?.id ?? "");
  const [before,   setBefore]   = useState([]);
  const [after,    setAfter]    = useState([]);
  const [note,     setNote]     = useState("");
  const [sent,     setSent]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState(null);

  const activeCat    = categories.find(c => c.id === catId);
  const activeSubs   = activeCat?.subcategories ?? [];
  const activeSub    = activeSubs.find(s => s.id === subId);
  const activeBranch = branches.find(b => b.id === branchId);

  const myAllTasks = tasks.filter(t =>
    t.assigned_to === "all" || t.assigned_to === user?.id
  );
  const myTasks = tasks.filter(t =>
    t.category_id === catId &&
    (!subId || t.subcategory_id === subId) &&
    (t.assigned_to === "all" || t.assigned_to === user?.id)
  );

  const changeCat = (id) => {
    setCatId(id);
    setSubId(categories.find(c => c.id === id)?.subcategories?.[0]?.id ?? "");
  };

  const startSubmitFor = (task) => {
    if (task.category_id) { setCatId(task.category_id); setSubId(task.subcategory_id ?? ""); }
    if (task.branch_id) setBranchId(task.branch_id);
    setSubmitTaskId(task.id);
    setTab("submit");
  };

  const handleSubmit = async () => {
    if (!note && !before.length && !after.length) return;
    setSaving(true);
    try {
      await onSubmit({
        task_id:           submitTaskId || null,
        category_id:      catId    || null,
        subcategory_id:   subId    || null,
        branch_id:        branchId || null,
        category_name:    activeCat?.name ?? "",
        subcategory_name: activeSub?.name ?? "",
        branch_name:      activeBranch?.name ?? "",
        before, after, note,
      });
      if (submitTaskId) onTaskToggle(submitTaskId, true);
      setBefore([]); setAfter([]); setNote(""); setSubmitTaskId(null);
      setSent(true); setTimeout(() => setSent(false), 3000);
    } finally { setSaving(false); }
  };

  if (categories.length === 0) return (
    <div style={{ ...S.muted, textAlign:"center", padding:40 }}>
      No categories set up yet. Ask your manager to add categories.
    </div>
  );

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Plan</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{todayStr()}</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
        {[["plan","📅 Plan"],["submit","📤 Submit Work"],["training","🎓 Training"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── PLAN — own weekly plan; tap today's task to jump to Submit Work ── */}
      {tab === "plan" && (
        <WeeklyPlan company={company} categories={categories}
          branches={branches.filter(b => b.id === user?.branch_id)} profile={profile}
          readOnly statusEditable lockedStaffId={user?.id}
          onItemClick={(item) => {
            const task = tasks.find(t => t.id === item.task_id);
            if (task) startSubmitFor(task);
          }}
        />
      )}

      {/* ── SUBMIT WORK ── */}
      {tab === "submit" && (
        <div>
          {submitTaskId && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 14px", background:C.accentColor+"14", border:`1px solid ${C.accentColor}33`,
              borderRadius:10, marginBottom:14, fontSize:12 }}>
              <span>📌 Submitting for: <strong>{myAllTasks.find(t => t.id === submitTaskId)?.title ?? "selected task"}</strong></span>
              <button onClick={() => setSubmitTaskId(null)}
                style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:11 }}>✕ Clear</button>
            </div>
          )}
          {!submitTaskId && (
            <>
              <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
                {categories.map(c => (
                  <button key={c.id} className="tab-btn" style={S.tab(catId===c.id)} onClick={() => changeCat(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>

              {activeSubs.length > 0 && (
                <div style={S.card}>
                  <div style={S.h3}>Section</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {activeSubs.map(s => (
                      <button key={s.id} className="pill-btn" onClick={() => setSubId(s.id)} style={{
                        padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                        background:subId===s.id?C.accentColor+"28":"transparent",
                        color:subId===s.id?C.accentColor:C.mutedColor,
                        border:subId===s.id?`1px solid ${C.accentColor}55`:`1px solid ${C.mutedColor}22`,
                      }}>{s.name}</button>
                    ))}
                  </div>
                </div>
              )}

              {myTasks.length > 0 && (
                <div style={S.card}>
                  <div style={S.h3}>Instructions for this section</div>
                  {myTasks.map(t => (
                    <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:9 }}>
                      <input type="checkbox" checked={t.is_done ?? t.done ?? false}
                        style={{ marginTop:3, accentColor:C.accentColor }}
                        onChange={() => onTaskToggle(t.id, !(t.is_done ?? t.done))}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,
                          color:(t.is_done||t.done)?C.mutedColor:C.textColor,
                          textDecoration:(t.is_done||t.done)?"line-through":"none" }}>
                          {t.title ?? t.text}
                        </div>
                        <div style={{ display:"flex", gap:6, marginTop:4 }}>
                          <span style={S.chip(t.priority)}>{t.priority}</span>
                          <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div style={S.card}>
            <div style={{ ...S.h2, marginBottom:14 }}>
              {activeCat?.name ?? "—"}
              {activeSub ? ` · ${activeSub.name}` : ""}
              {activeBranch ? <span style={{ ...S.muted, fontSize:13 }}> · {activeBranch.name}</span> : null}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <ImageUploader label="Before" files={before} onChange={setBefore}/>
              <ImageUploader label="After"  files={after}  onChange={setAfter}/>
            </div>
            <div style={S.lbl}>Notes / Feedback</div>
            <textarea style={{ ...S.inp, resize:"vertical", minHeight:76 }}
              placeholder="Describe what was done, any issues…"
              value={note} onChange={e => setNote(e.target.value)}/>
            {sent && <div style={{ color:"#4ade80", fontSize:13, marginBottom:8 }}>✓ Submitted!</div>}
            <button className="btnP" style={{ ...S.btnP, width:"100%" }}
              onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting…" : "Submit Implementation →"}
            </button>
          </div>
        </div>
      )}

      {/* ── TRAINING (view only) ── */}
      {tab === "training" && <Training company={company} profile={profile} branches={branches} readOnly />}
    </div>
  );
}