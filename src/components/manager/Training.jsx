import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000088", zIndex:900,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"var(--clr-surface)", borderRadius:16, padding:28,
        maxWidth:320, width:"100%", border:"1px solid #f8717133" }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:20, lineHeight:1.5 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ flex:1, padding:"10px", background:"#f87171", color:"#fff",
            border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}
            onClick={onConfirm}>Delete</button>
          <button style={{ flex:1, padding:"10px", background:"transparent", color:"var(--clr-muted)",
            border:"1px solid #6b688033", borderRadius:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
            onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function Training({ company, profile, branches = [], readOnly = false }) {
  const [trainings, setTrainings] = useState([]);
  const [staff,     setStaff]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [confirm,   setConfirm]   = useState(null);

  // Form
  const [title,        setTitle]        = useState("");
  const [trainingType, setTrainingType] = useState("");
  const [trainer,      setTrainer]      = useState(profile?.full_name ?? "");
  const [date,         setDate]         = useState(new Date().toISOString().slice(0,10));
  const [endDate,      setEndDate]      = useState("");
  const [branchIds,    setBranchIds]    = useState([]); // empty = All Branches
  const [location,     setLocation]     = useState("");
  const [notes,        setNotes]        = useState("");
  const [picked,       setPicked]       = useState([]);

  // Edit (existing training)
  const [editing,   setEditing]   = useState(false);
  const [eSaving,   setESaving]   = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    loadAll();
    loadStaff();
  }, [company?.id]);

  const loadAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trainings")
      .select("*, attendees:training_attendees(id, user_id, status, score, note, user:user_id(full_name))")
      .eq("company_id", company.id)
      .order("date", { ascending:false });
    setTrainings(data ?? []);
    setLoading(false);
  };

  const loadStaff = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("company_id", company.id)
      .in("role", ["vm","store_manager","area_manager","manager"])
      .order("full_name");
    setStaff(data ?? []);
  };

  const createTraining = async () => {
    if (!title.trim() || !trainer.trim() || !date) return;
    setSaving(true);
    try {
      const { data: tr } = await supabase
        .from("trainings")
        .insert({ company_id:company.id, title, training_type:trainingType||null, trainer,
          date, end_date:endDate||null, branch_ids:branchIds.length ? branchIds : null, location, notes, created_by:profile.id })
        .select().single();
      if (tr && picked.length > 0) {
        await supabase.from("training_attendees").insert(
          picked.map(uid => ({ training_id:tr.id, user_id:uid, status:"pending" }))
        );
      }
      setTitle(""); setTrainingType(""); setTrainer(profile?.full_name ?? "");
      setDate(new Date().toISOString().slice(0,10)); setEndDate(""); setBranchIds([]);
      setLocation(""); setNotes(""); setPicked([]);
      setShowForm(false);
      loadAll();
    } finally { setSaving(false); }
  };

  const startEdit = () => {
    setTitle(selected.title); setTrainingType(selected.training_type ?? "");
    setTrainer(selected.trainer); setDate(selected.date); setEndDate(selected.end_date ?? "");
    setBranchIds(selected.branch_ids ?? []); setLocation(selected.location ?? ""); setNotes(selected.notes ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!title.trim() || !trainer.trim() || !date) return;
    setESaving(true);
    try {
      const updates = { title, training_type:trainingType||null, trainer,
        date, end_date:endDate||null, branch_ids:branchIds.length ? branchIds : null, location, notes };
      await supabase.from("trainings").update(updates).eq("id", selected.id);
      setSelected(prev => ({ ...prev, ...updates }));
      setTrainings(prev => prev.map(t => t.id === selected.id ? { ...t, ...updates } : t));
      setEditing(false);
    } finally { setESaving(false); }
  };

  const togglePick = (id) =>
    setPicked(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);

  const toggleBranch = (id) =>
    setBranchIds(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);

  const branchLabel = (ids) => {
    if (!ids?.length) return "All Branches";
    const names = ids.map(id => branches.find(b => b.id === id)?.name).filter(Boolean);
    return names.length ? names.join(", ") : "All Branches";
  };

  const updateAttendee = async (attendeeId, field, value) => {
    // Validate score
    if (field === "score" && value !== null) {
      const n = Number(value);
      if (isNaN(n) || n < 0 || n > 100) return;
    }
    await supabase.from("training_attendees")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", attendeeId);
    const update = (list) => list.map(a => a.id===attendeeId ? {...a,[field]:value} : a);
    setSelected(prev => prev ? { ...prev, attendees: update(prev.attendees) } : prev);
    setTrainings(prev => prev.map(t => t.id===selected?.id
      ? { ...t, attendees: update(t.attendees) } : t));
  };

  const deleteTraining = (id) => {
    setConfirm({
      message: "Delete this training and all attendance records?",
      onConfirm: async () => {
        await supabase.from("trainings").delete().eq("id", id);
        setTrainings(p => p.filter(t => t.id !== id));
        if (selected?.id === id) setSelected(null);
        setConfirm(null);
      }
    });
  };

  const stats = (t) => {
    const att = t.attendees ?? [];
    const present = att.filter(a => a.status==="present").length;
    const absent  = att.filter(a => a.status==="absent").length;
    const scores  = att.filter(a => a.score != null).map(a => Number(a.score));
    const avg     = scores.length ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length) : null;
    return { total:att.length, present, absent, avg };
  };

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:30 }}>Loading…</div>;

  // ── DETAIL VIEW ──
  if (selected) {
    const att = selected.attendees ?? [];
    const s = stats(selected);
    return (
      <div>
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)}/>}
        <button className="btnG" style={{ ...S.btnG, marginBottom:16, fontSize:12 }}
          onClick={() => { setSelected(null); setEditing(false); }}>← Back</button>

        {editing ? (
          <div style={S.card}>
            <div style={S.h3}>Edit Training</div>
            <div style={S.lbl}>Training Title *</div>
            <input style={S.inp} value={title} onChange={e => setTitle(e.target.value)}/>
            <div style={S.lbl}>Training Type</div>
            <input style={S.inp} placeholder="e.g. Onboarding, Visual Standards, Product Knowledge"
              value={trainingType} onChange={e => setTrainingType(e.target.value)}/>
            <div style={S.lbl}>Trainer *</div>
            <input style={S.inp} value={trainer} onChange={e => setTrainer(e.target.value)}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <div style={S.lbl}>Starts *</div>
                <input style={S.inp} type="date" value={date} onChange={e => setDate(e.target.value)}/>
              </div>
              <div>
                <div style={S.lbl}>Ends</div>
                <input style={S.inp} type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
              </div>
            </div>
            <div style={S.lbl}>Branches</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              <button className="pill-btn" onClick={() => setBranchIds([])}
                style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                  background: branchIds.length===0 ? C.accentColor+"28" : "transparent",
                  color: branchIds.length===0 ? C.accentColor : C.mutedColor,
                  border:`1px solid ${branchIds.length===0 ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
                {branchIds.length===0 ? "✓ All Branches" : "All Branches"}
              </button>
              {branches.map(b => (
                <button key={b.id} className="pill-btn" onClick={() => toggleBranch(b.id)}
                  style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                    background: branchIds.includes(b.id) ? C.accentColor+"28" : "transparent",
                    color: branchIds.includes(b.id) ? C.accentColor : C.mutedColor,
                    border:`1px solid ${branchIds.includes(b.id) ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
                  {branchIds.includes(b.id) ? "✓ " : ""}{b.name}
                </button>
              ))}
            </div>
            <div style={S.lbl}>Location</div>
            <input style={S.inp} value={location} onChange={e => setLocation(e.target.value)}/>
            <div style={S.lbl}>Notes</div>
            <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
              value={notes} onChange={e => setNotes(e.target.value)}/>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btnP" style={{ ...S.btnP, flex:1 }} onClick={saveEdit} disabled={eSaving || !title.trim()}>
                {eSaving ? "Saving…" : "Save Changes →"}
              </button>
              <button className="btnG" style={S.btnG} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
        <div style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
            <div style={{ fontWeight:700, fontSize:18 }}>{selected.title}</div>
            {!readOnly && (
              <button className="btnG" style={{ ...S.btnG, fontSize:12, padding:"6px 12px", flexShrink:0 }}
                onClick={startEdit}>✎ Edit</button>
            )}
          </div>
          {selected.training_type && (
            <div style={{ display:"inline-block", fontSize:11, fontWeight:700, color:C.accentColor,
              background:C.accentColor+"18", padding:"3px 10px", borderRadius:12, marginBottom:8 }}>
              {selected.training_type}
            </div>
          )}
          <div style={{ ...S.muted, fontSize:12, marginBottom:12 }}>
            👨‍🏫 {selected.trainer} · 📅 {selected.date}{selected.end_date ? ` → ${selected.end_date}` : ""}
            {` · 🗺️ ${branchLabel(selected.branch_ids)}`}
            {selected.location && ` · 📍 ${selected.location}`}
          </div>
          {selected.notes && (
            <div style={{ fontSize:13, padding:"10px 12px", background:C.surfaceHigh,
              borderRadius:8, marginBottom:12, lineHeight:1.5 }}>
              {selected.notes}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[["👥",s.total,"Total"],["✅",s.present,"Present"],
              ["❌",s.absent,"Absent"],["⭐",s.avg??"—","Avg Score"]].map(([icon,val,lbl]) => (
              <div key={lbl} style={{ textAlign:"center", padding:"12px 6px",
                background:C.surfaceHigh, borderRadius:10 }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:18, color:C.accentColor }}>{val}</div>
                <div style={{ fontSize:10, color:C.mutedColor }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        )}

        <div style={S.h3}>Attendees ({att.length})</div>
        {att.length === 0 && (
          <div style={{ ...S.muted, textAlign:"center", padding:20 }}>No attendees added.</div>
        )}
        {att.map(a => {
          const isMe = a.user_id === profile?.id;
          const canEditStatus = !readOnly || isMe;
          return (
          <div key={a.id} style={{ ...S.card, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>
                {a.user?.full_name ?? "—"}{isMe && <span style={{ color:C.accentColor, fontWeight:400 }}> (you)</span>}
              </div>
              {!canEditStatus ? (
                <span style={{ padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:600,
                  background: a.status==="present" ? "#4ade80" : a.status==="absent" ? "#f87171" : C.surfaceHigh,
                  color: a.status==="present" || a.status==="absent" ? "#0a0a0f" : C.mutedColor }}>
                  {a.status==="present" ? "✓ Present" : a.status==="absent" ? "✗ Absent" : "Pending"}
                </span>
              ) : (
                <div style={{ display:"flex", gap:6 }}>
                  {["present","absent","pending"].map(st => (
                    <button key={st} onClick={() => updateAttendee(a.id, "status", st)}
                      style={{ padding:"4px 10px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:600,
                        border: a.status===st ? "none" : `1px solid ${C.mutedColor}33`,
                        background: a.status===st
                          ? st==="present" ? "#4ade80" : st==="absent" ? "#f87171" : C.surfaceHigh
                          : "transparent",
                        color: a.status===st
                          ? st==="present" ? "#0a0a0f" : "#fff"
                          : C.mutedColor,
                      }}>
                      {st==="present" ? "✓ Present" : st==="absent" ? "✗ Absent" : "Pending"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
              <div>
                <div style={S.lbl}>Score /100</div>
                {readOnly ? (
                  <div style={{ fontSize:16, fontWeight:700, textAlign:"center" }}>{a.score ?? "—"}</div>
                ) : (
                  <input style={{ ...S.inp, marginBottom:0, textAlign:"center", fontSize:16, fontWeight:700 }}
                    type="number" min="0" max="100" placeholder="—"
                    value={a.score ?? ""}
                    onChange={e => {
                      const v = e.target.value;
                      if (v === "" || (Number(v) >= 0 && Number(v) <= 100)) {
                        updateAttendee(a.id, "score", v === "" ? null : Number(v));
                      }
                    }}/>
                )}
              </div>
              <div>
                <div style={S.lbl}>Note</div>
                {readOnly ? (
                  <div style={{ fontSize:13, color:C.mutedColor }}>{a.note || "—"}</div>
                ) : (
                  <input style={{ ...S.inp, marginBottom:0 }}
                    placeholder="Optional note…"
                    value={a.note ?? ""}
                    onBlur={e => updateAttendee(a.id, "note", e.target.value || null)}
                    onChange={e => setSelected(prev => ({
                      ...prev,
                      attendees: prev.attendees.map(x => x.id===a.id ? {...x, note:e.target.value} : x)
                    }))}/>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div>
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)}/>}

      {!readOnly && !showForm && (
        <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
          onClick={() => setShowForm(true)}>
          ＋ New Training
        </button>
      )}

      {!readOnly && showForm && (
        <div style={S.card}>
          <div style={S.h3}>New Training</div>
          <div style={S.lbl}>Training Title *</div>
          <input style={S.inp} placeholder="e.g. VM Display Standards Q3"
            value={title} onChange={e => setTitle(e.target.value)}/>
          <div style={S.lbl}>Training Type</div>
          <input style={S.inp} placeholder="e.g. Onboarding, Visual Standards, Product Knowledge"
            value={trainingType} onChange={e => setTrainingType(e.target.value)}/>
          <div style={S.lbl}>Trainer *</div>
          <input style={S.inp} placeholder="Trainer name"
            value={trainer} onChange={e => setTrainer(e.target.value)}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={S.lbl}>Starts *</div>
              <input style={S.inp} type="date"
                value={date} onChange={e => setDate(e.target.value)}/>
            </div>
            <div>
              <div style={S.lbl}>Ends</div>
              <input style={S.inp} type="date"
                value={endDate} onChange={e => setEndDate(e.target.value)}/>
            </div>
          </div>
          <div style={S.lbl}>Branches</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
            <button className="pill-btn" onClick={() => setBranchIds([])}
              style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background: branchIds.length===0 ? C.accentColor+"28" : "transparent",
                color: branchIds.length===0 ? C.accentColor : C.mutedColor,
                border:`1px solid ${branchIds.length===0 ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
              {branchIds.length===0 ? "✓ All Branches" : "All Branches"}
            </button>
            {branches.map(b => (
              <button key={b.id} className="pill-btn" onClick={() => toggleBranch(b.id)}
                style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                  background: branchIds.includes(b.id) ? C.accentColor+"28" : "transparent",
                  color: branchIds.includes(b.id) ? C.accentColor : C.mutedColor,
                  border:`1px solid ${branchIds.includes(b.id) ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
                {branchIds.includes(b.id) ? "✓ " : ""}{b.name}
              </button>
            ))}
          </div>
          <div style={S.lbl}>Location</div>
          <input style={S.inp} placeholder="e.g. Sultan Mall Training Room"
            value={location} onChange={e => setLocation(e.target.value)}/>
          <div style={S.lbl}>Notes</div>
          <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
            placeholder="Training objectives, agenda…"
            value={notes} onChange={e => setNotes(e.target.value)}/>

          <div style={S.h3}>Add Attendees ({picked.length} selected)</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            <button className="pill-btn"
              onClick={() => setPicked(picked.length===staff.length ? [] : staff.map(s=>s.id))}
              style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                background: picked.length===staff.length ? C.accentColor+"28" : "transparent",
                color: picked.length===staff.length ? C.accentColor : C.mutedColor,
                border:`1px solid ${picked.length===staff.length ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
              {picked.length===staff.length ? "✓ All Selected" : "Select All"}
            </button>
            {staff.map(s => (
              <button key={s.id} className="pill-btn" onClick={() => togglePick(s.id)}
                style={{ padding:"6px 13px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600,
                  background: picked.includes(s.id) ? C.accentColor+"28" : "transparent",
                  color: picked.includes(s.id) ? C.accentColor : C.mutedColor,
                  border:`1px solid ${picked.includes(s.id) ? C.accentColor+"55" : C.mutedColor+"22"}` }}>
                {picked.includes(s.id) ? "✓ " : ""}{s.full_name}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btnP" style={{ ...S.btnP, flex:1 }}
              onClick={createTraining} disabled={saving || !title.trim()}>
              {saving ? "Creating…" : "Create Training →"}
            </button>
            <button className="btnG" style={S.btnG} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {trainings.length===0 && !showForm && (
        <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🎓</div>
          <div style={{ ...S.muted }}>No trainings yet.</div>
        </div>
      )}

      {trainings.map(t => {
        const s = stats(t);
        const pct = s.total ? Math.round((s.present/s.total)*100) : 0;
        return (
          <div key={t.id} style={{ ...S.card, cursor:"pointer" }} onClick={() => setSelected(t)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{t.title}</div>
                  {t.training_type && (
                    <span style={{ fontSize:10, fontWeight:700, color:C.accentColor,
                      background:C.accentColor+"18", padding:"2px 8px", borderRadius:10 }}>{t.training_type}</span>
                  )}
                </div>
                <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
                  👨‍🏫 {t.trainer} · 📅 {t.date}{t.end_date ? ` → ${t.end_date}` : ""}
                  {` · 🗺️ ${branchLabel(t.branch_ids)}`}
                  {t.location && ` · 📍 ${t.location}`}
                </div>
              </div>
              {!readOnly && (
                <button onClick={e => { e.stopPropagation(); deleteTraining(t.id); }}
                  style={{ background:"none", border:"none", color:"#f87171",
                    cursor:"pointer", fontSize:16, padding:"4px", flexShrink:0 }}>🗑️</button>
              )}
            </div>
            {s.total > 0 && (
              <>
                <div style={{ display:"flex", gap:12, marginBottom:8 }}>
                  <span style={{ fontSize:12, color:"#4ade80" }}>✅ {s.present} Present</span>
                  <span style={{ fontSize:12, color:"#f87171" }}>❌ {s.absent} Absent</span>
                  <span style={{ fontSize:12, color:C.mutedColor }}>⏳ {s.total-s.present-s.absent} Pending</span>
                  {s.avg!=null && <span style={{ fontSize:12, color:C.accentColor }}>⭐ Avg {s.avg}</span>}
                </div>
                <div style={{ height:4, borderRadius:2, background:C.surfaceHigh }}>
                  <div style={{ height:"100%", borderRadius:2, width:`${pct}%`,
                    background:pct===100?"#4ade80":C.accentColor, transition:"width .4s" }}/>
                </div>
                <div style={{ ...S.muted, fontSize:11, marginTop:4 }}>{pct}% attendance recorded</div>
              </>
            )}
            {s.total===0 && <div style={{ fontSize:12, color:C.mutedColor }}>No attendees yet</div>}
            <div style={{ fontSize:11, color:C.accentColor, marginTop:8 }}>Tap to manage →</div>
          </div>
        );
      })}
    </div>
  );
}