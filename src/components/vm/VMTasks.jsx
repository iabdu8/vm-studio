import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { todayStr } from "../../utils.js";
import { ImageUploader } from "../shared/Atoms.jsx";

export function VMTasks({ user, categories, tasks, setTasks, onSubmit, onTaskToggle }) {
  const [catId,   setCatId]   = useState(categories[0]?.id ?? "");
  const [subId,   setSubId]   = useState(categories[0]?.subcategories?.[0]?.id ?? "");
  const [before,  setBefore]  = useState([]);
  const [after,   setAfter]   = useState([]);
  const [note,    setNote]    = useState("");
  const [sent,    setSent]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  const activeCat  = categories.find(c => c.id === catId);
  const activeSubs = activeCat?.subcategories ?? [];
  const activeSub  = activeSubs.find(s => s.id === subId);

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
        category_id:    catId    || null,
        subcategory_id: subId    || null,
        categoryName:   activeCat?.name ?? "",
        subcategoryName:activeSub?.name ?? "",
        before, after, note,
        branch_id: user?.branch_id ?? null,
      });
      setBefore([]); setAfter([]); setNote("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally { setSaving(false); }
  };

  if (categories.length === 0) {
    return (
      <div style={{ ...S.muted, textAlign:"center", padding:40 }}>
        No categories set up yet.<br/>Ask your manager to add categories.
      </div>
    );
  }

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        My <span style={S.accent}>Tasks</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        {user?.branch?.name ?? user?.branch ?? ""} · {todayStr()}
      </div>

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
                transition:"all .2s",
              }}>{s.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Assigned tasks */}
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
                <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center" }}>
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
  );
}
