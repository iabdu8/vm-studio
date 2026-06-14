import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { ImageUploader } from "../shared/Atoms.jsx";

export function VMTasks({ user, categories, branches, tasks, setTasks, onSubmit, onTaskToggle }) {
  const [catId,    setCatId]    = useState(categories[0]?.id ?? "");
  const [subId,    setSubId]    = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [branchId, setBranchId] = useState(user?.branch_id ?? branches[0]?.id ?? "");
  const [before,   setBefore]   = useState([]);
  const [after,    setAfter]    = useState([]);
  const [note,     setNote]     = useState("");
  const [sent,     setSent]     = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState("my"); // "my" | "submit"

  const activeCat    = categories.find(c => c.id === catId);
  const activeSubs   = activeCat?.subcategories ?? [];
  const activeSub    = activeSubs.find(s => s.id === subId);
  const activeBranch = branches.find(b => b.id === branchId);

  // All tasks assigned to me (specific or all)
  const myAllTasks = tasks.filter(t =>
    t.assigned_to === "all" || t.assigned_to === user?.id
  );

  // Tasks for current category/section
  const myTasks = tasks.filter(t =>
    t.category_id === catId &&
    (!subId || t.subcategory_id === subId) &&
    (t.assigned_to === "all" || t.assigned_to === user?.id)
  );

  const changeCat = (id) => {
    setCatId(id);
    const cat = categories.find(c => c.id === id);
    setSubId(cat?.subcategories?.[0]?.id ?? "");
  };

  const handleSubmit = async () => {
    if (!note && !before.length && !after.length) return;
    setSaving(true);
    try {
      await onSubmit({
        category_id:     catId    || null,
        subcategory_id:  subId    || null,
        branch_id:       branchId || null,
        category_name:    activeCat?.name ?? "",
        subcategory_name: activeSub?.name ?? "",
        branch_name:      activeBranch?.name ?? "",
        before, after, note,
      });
      setBefore([]); setAfter([]); setNote("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally { setSaving(false); }
  };

  if (categories.length === 0) return (
    <div style={{ ...S.muted, textAlign:"center", padding:40 }}>
      No categories set up yet. Ask your manager to add categories.
    </div>
  );

  const done  = myAllTasks.filter(t => t.is_done ?? t.done).length;
  const total = myAllTasks.length;

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Tasks</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{todayStr()}</div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["my","📋 My Tasks"],["submit","📤 Submit Work"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── MY TASKS TAB ── */}
      {tab === "my" && (
        <div>
          {/* Progress */}
          {myAllTasks.length > 0 && (
            <div style={{ ...S.card, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={S.h3}>Overall Progress</div>
                <span style={{ fontSize:13, fontWeight:700,
                  color: done===total && total>0 ? "#4ade80" : C.accentColor }}>
                  {total ? Math.round((done/total)*100) : 0}%
                </span>
              </div>
              <div style={{ height:5, borderRadius:3, background:C.surfaceHigh }}>
                <div style={{ height:"100%", borderRadius:3, transition:"width .4s",
                  width: total ? `${Math.round((done/total)*100)}%` : "0%",
                  background: done===total && total>0 ? "#4ade80" : C.accentColor }}/>
              </div>
              <div style={{ ...S.muted, fontSize:11, marginTop:6 }}>
                {done} of {total} tasks completed
              </div>
            </div>
          )}

          {myAllTasks.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
              <div style={{ ...S.muted }}>No tasks assigned to you yet.</div>
            </div>
          )}

          {/* Group by category */}
          {categories.map(cat => {
            const catTasks = myAllTasks.filter(t => t.category_id === cat.id);
            if (!catTasks.length) return null;
            return (
              <div key={cat.id} style={S.card}>
                <div style={{ ...S.h3, marginBottom:10 }}>
                  {cat.icon} {cat.name}
                </div>
                {catTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
                    padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <input type="checkbox" checked={t.is_done ?? t.done ?? false}
                      style={{ marginTop:3, accentColor:C.accentColor }}
                      onChange={() => onTaskToggle(t.id, !(t.is_done ?? t.done))}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,
                        color: (t.is_done||t.done) ? C.mutedColor : C.textColor,
                        textDecoration: (t.is_done||t.done) ? "line-through" : "none" }}>
                        {t.title ?? t.text}
                      </div>
                      <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                        <span style={S.chip(t.priority)}>{t.priority}</span>
                        <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label ?? t.dueDate}</span>
                        {t.subcategory?.name && (
                          <span style={{ ...S.muted, fontSize:11 }}>· {t.subcategory.name}</span>
                        )}
                        {t.assigned_to !== "all" && (
                          <span style={{ fontSize:11, color:"#818cf8" }}>👤 Assigned to you</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Uncategorized tasks */}
          {(() => {
            const uncatTasks = myAllTasks.filter(t => !t.category_id);
            if (!uncatTasks.length) return null;
            return (
              <div style={S.card}>
                <div style={S.h3}>General</div>
                {uncatTasks.map(t => (
                  <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start",
                    padding:"9px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <input type="checkbox" checked={t.is_done ?? t.done ?? false}
                      style={{ marginTop:3, accentColor:C.accentColor }}
                      onChange={() => onTaskToggle(t.id, !(t.is_done ?? t.done))}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,
                        color: (t.is_done||t.done) ? C.mutedColor : C.textColor,
                        textDecoration: (t.is_done||t.done) ? "line-through" : "none" }}>
                        {t.title ?? t.text}
                      </div>
                      <div style={{ display:"flex", gap:6, marginTop:4 }}>
                        <span style={S.chip(t.priority)}>{t.priority}</span>
                        <span style={{ ...S.muted, fontSize:11 }}>Due: {t.due_label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── SUBMIT WORK TAB ── */}
      {tab === "submit" && (
        <div>
          {/* Branch selector */}
          {branches.length > 1 && (
            <div style={S.card}>
              <div style={S.h3}>Branch</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {branches.map(b => (
                  <button key={b.id} className="pill-btn" onClick={() => setBranchId(b.id)} style={{
                    padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                    background: branchId===b.id ? C.accentColor+"28" : "transparent",
                    color:      branchId===b.id ? C.accentColor : C.mutedColor,
                    border:     branchId===b.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
                  }}>{b.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:2 }}>
            {categories.map(c => (
              <button key={c.id} className="tab-btn" style={S.tab(catId===c.id)} onClick={() => changeCat(c.id)}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Subcategory pills */}
          {activeSubs.length > 0 && (
            <div style={S.card}>
              <div style={S.h3}>Section</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {activeSubs.map(s => (
                  <button key={s.id} className="pill-btn" onClick={() => setSubId(s.id)} style={{
                    padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                    background: subId===s.id ? C.accentColor+"28" : "transparent",
                    color:      subId===s.id ? C.accentColor : C.mutedColor,
                    border:     subId===s.id ? `1px solid ${C.accentColor}55` : `1px solid ${C.mutedColor}22`,
                  }}>{s.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks for this section */}
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
                      color: (t.is_done||t.done) ? C.mutedColor : C.textColor,
                      textDecoration: (t.is_done||t.done) ? "line-through" : "none" }}>
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

          {/* Submission form */}
          <div style={S.card}>
            <div style={{ ...S.h2, marginBottom:14 }}>
              {activeCat?.icon} {activeCat?.name ?? "—"}
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
    </div>
  );
}