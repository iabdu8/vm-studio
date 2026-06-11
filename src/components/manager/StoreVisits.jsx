import { useState } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { ImageUploader } from "../shared/Atoms.jsx";

// ============================================================
//  STORE VISITS
//  Area Manager / VM Manager يوثّق زيارات الفروع
// ============================================================

const STATUS_META = {
  draft:     { label:"Draft",     color:"#6b6880" },
  submitted: { label:"Submitted", color:"#d4a82a" },
  reviewed:  { label:"Reviewed",  color:"#818cf8" },
  closed:    { label:"Closed",    color:"#4ade80" },
};

export function StoreVisits({ company, branches, profile, visits, onVisitCreated }) {
  const [showForm,  setShowForm]  = useState(false);
  const [branchId,  setBranchId]  = useState(branches[0]?.id ?? "");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0,10));
  const [notes,     setNotes]     = useState("");
  const [photos,    setPhotos]    = useState([]);
  const [findings,  setFindings]  = useState([{ finding:"", recommendation:"" }]);
  const [saving,    setSaving]    = useState(false);
  const [selected,  setSelected]  = useState(null);

  const addFinding = () => setFindings(p => [...p, { finding:"", recommendation:"" }]);
  const updateFinding = (i, key, val) =>
    setFindings(p => p.map((f, idx) => idx===i ? { ...f, [key]: val } : f));
  const removeFinding = (i) => setFindings(p => p.filter((_, idx) => idx !== i));

  const saveVisit = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      // 1 — create visit
      const { data: visit } = await supabase
        .from("store_visits")
        .insert({ company_id:company.id, branch_id:branchId, visitor_id:profile.id,
          visit_date:visitDate, notes, status:"submitted" })
        .select().single();

      // 2 — upload photos & add findings
      if (visit) {
        for (const p of photos) {
          const safeName = (p.file?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${company.id}/visits/${visit.id}-${Date.now()}-${safeName}`;
          await supabase.storage.from("vm-photos").upload(path, p.file ?? p);
          const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
          await supabase.from("visit_findings")
            .insert({ visit_id: visit.id, finding: "Photo", image_url: url, recommendation:"" });
        }
        for (const f of findings.filter(f => f.finding.trim())) {
          await supabase.from("visit_findings")
            .insert({ visit_id: visit.id, finding: f.finding, recommendation: f.recommendation });
        }
      }

      onVisitCreated?.();
      setShowForm(false);
      setNotes(""); setPhotos([]);
      setFindings([{ finding:"", recommendation:"" }]);
    } finally { setSaving(false); }
  };

  const convertToTask = async (finding) => {
    if (!finding.finding.trim()) return;
    const { data } = await supabase.from("tasks")
      .insert({ company_id:company.id, branch_id:branchId,
        title: finding.finding, priority:"high",
        due_label:"This week", assigned_to:"all", created_by:profile.id })
      .select().single();
    if (data) {
      await supabase.from("visit_findings")
        .update({ task_id: data.id }).eq("id", finding.id);
      alert("✓ Converted to task!");
    }
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Store <span style={S.accent}>Visits</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Document and follow up on branch visits
      </div>

      <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
        onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "＋ New Visit Report"}
      </button>

      {/* New visit form */}
      {showForm && (
        <div style={S.card}>
          <div style={S.h3}>Visit Details</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={S.lbl}>Branch</div>
              <select style={S.sel} value={branchId} onChange={e => setBranchId(e.target.value)}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <div style={S.lbl}>Visit Date</div>
              <input style={S.inp} type="date" value={visitDate}
                onChange={e => setVisitDate(e.target.value)} />
            </div>
          </div>

          <div style={S.lbl}>Notes</div>
          <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
            placeholder="General observations…"
            value={notes} onChange={e => setNotes(e.target.value)} />

          <ImageUploader label="Photos" max={20} files={photos} onChange={setPhotos} />

          <div style={{ ...S.h3, marginTop:12 }}>Findings & Recommendations</div>
          {findings.map((f, i) => (
            <div key={i} style={{ marginBottom:10, padding:"12px", background:C.surfaceHigh, borderRadius:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.accentColor }}>Finding {i+1}</div>
                {findings.length > 1 && (
                  <button onClick={() => removeFinding(i)}
                    style={{ background:"none", border:"none", color:C.mutedColor, cursor:"pointer", fontSize:13 }}>✕</button>
                )}
              </div>
              <input style={{ ...S.inp, marginTop:0, marginBottom:8 }}
                placeholder="What did you observe?"
                value={f.finding} onChange={e => updateFinding(i, "finding", e.target.value)} />
              <input style={{ ...S.inp, marginTop:0, marginBottom:0 }}
                placeholder="Recommendation (optional)"
                value={f.recommendation} onChange={e => updateFinding(i, "recommendation", e.target.value)} />
            </div>
          ))}

          <button className="btnG" style={{ ...S.btnG, fontSize:12, marginBottom:14 }}
            onClick={addFinding}>
            ＋ Add Finding
          </button>

          <button className="btnP" style={{ ...S.btnP, width:"100%" }}
            onClick={saveVisit} disabled={saving}>
            {saving ? "Saving…" : "Submit Visit Report →"}
          </button>
        </div>
      )}

      {/* Visits list */}
      {visits.length === 0 && !showForm && (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No visits recorded yet.</div>
      )}

      {visits.map(v => {
        const meta = STATUS_META[v.status] ?? STATUS_META.draft;
        const branch = branches.find(b => b.id === v.branch_id);
        return (
          <div key={v.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>
                  📍 {branch?.name ?? "—"}
                </div>
                <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
                  {v.visit_date} · by {v.visitor?.full_name ?? "—"}
                </div>
              </div>
              <span style={{ padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700,
                background:meta.color+"1c", color:meta.color, border:`1px solid ${meta.color}44` }}>
                {meta.label}
              </span>
            </div>

            {v.notes && (
              <div style={{ fontSize:13, marginTop:8, padding:"8px 12px",
                background:C.surfaceHigh, borderRadius:8, lineHeight:1.5 }}>
                {v.notes}
              </div>
            )}

            {/* Findings */}
            {v.findings?.length > 0 && (
              <div style={{ marginTop:10 }}>
                <div style={S.h3}>Findings ({v.findings.length})</div>
                {v.findings.map((f, i) => (
                  <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>🔍 {f.finding}</div>
                    {f.recommendation && (
                      <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>
                        💡 {f.recommendation}
                      </div>
                    )}
                    {!f.task_id && (
                      <button onClick={() => convertToTask(f)}
                        style={{ ...S.btnG, fontSize:11, padding:"4px 10px", marginTop:6 }}
                        className="btnG">
                        → Convert to Task
                      </button>
                    )}
                    {f.task_id && (
                      <span style={{ fontSize:11, color:"#4ade80", marginTop:4, display:"block" }}>
                        ✓ Converted to task
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}