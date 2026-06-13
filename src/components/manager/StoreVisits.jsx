import { printHTML } from "../../lib/printReport.js";
import { useState, useRef } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { notifyManagers, notifyBranch } from "../../services/enterprise.service.js";

const STATUS_META = {
  draft:     { label:"Draft",     color:"#6b6880" },
  submitted: { label:"Submitted", color:"#d4a82a" },
  reviewed:  { label:"Reviewed",  color:"#818cf8" },
  closed:    { label:"Closed",    color:"#4ade80" },
};

export function StoreVisits({ company, branches, profile, visits, onVisitCreated, onDeleteVisit }) {
  const [showForm,  setShowForm]  = useState(false);
  const [branchId,  setBranchId]  = useState(branches[0]?.id ?? "");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0,10));
  const [notes,     setNotes]     = useState("");
  const [photos,    setPhotos]    = useState([]); // [{file, url, comment}]
  const [findings,  setFindings]  = useState([{ finding:"", recommendation:"" }]);
  const [saving,    setSaving]    = useState(false);
  const cameraRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(p => [...p, ...files.map(f => ({ file:f, url:URL.createObjectURL(f), comment:"" }))]);
    e.target.value = "";
  };

  const updatePhotoComment = (i, val) =>
    setPhotos(p => p.map((ph, idx) => idx===i ? { ...ph, comment:val } : ph));

  const removePhoto = (i) => setPhotos(p => p.filter((_, idx) => idx !== i));

  const addFinding = () => setFindings(p => [...p, { finding:"", recommendation:"" }]);
  const updateFinding = (i, key, val) =>
    setFindings(p => p.map((f, idx) => idx===i ? { ...f, [key]:val } : f));
  const removeFinding = (i) => setFindings(p => p.filter((_, idx) => idx !== i));

  const saveVisit = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      const { data: visit } = await supabase
        .from("store_visits")
        .insert({ company_id:company.id, branch_id:branchId, visitor_id:profile.id,
          visit_date:visitDate, notes, status:"submitted" })
        .select().single();

      if (visit) {
        // Upload photos with comments
        for (const p of photos) {
          const safeName = (p.file?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${company.id}/visits/${visit.id}-${Date.now()}-${safeName}`;
          await supabase.storage.from("vm-photos").upload(path, p.file);
          const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
          await supabase.from("visit_findings")
            .insert({ visit_id:visit.id, finding:"Photo", image_url:url,
              recommendation: p.comment || "" });
        }
        for (const f of findings.filter(f => f.finding.trim())) {
          await supabase.from("visit_findings")
            .insert({ visit_id:visit.id, finding:f.finding, recommendation:f.recommendation });
        }

        notifyManagers(company.id, "visit_created", "New Store Visit 🚶",
          (profile.full_name ?? "") + " submitted a visit report for " +
          (branches.find(b => b.id === branchId)?.name ?? ""));

        notifyBranch(company.id, branchId, "visit_created", "Store Visit Report 🚶",
          "A visit report was submitted for your branch");
      }

      onVisitCreated?.();
      setShowForm(false);
      setNotes(""); setPhotos([]); setFindings([{ finding:"", recommendation:"" }]);
    } finally { setSaving(false); }
  };

  const printVisit = (v) => {
    const branch = branches.find(b => b.id === v.branch_id)?.name ?? "—";
    const photoFindings = (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url);
    const textFindings  = (v.findings ?? []).filter(f => f.finding !== "Photo");

    const html = `<!DOCTYPE html><html><head>
    <style>
      body { font-family:'DM Sans',sans-serif; padding:32px; color:#1a1a2e; }
      h1 { font-size:24px; color:#c8a96e; margin-bottom:4px; }
      .meta { color:#9ca3af; font-size:13px; margin-bottom:20px; }
      .note { background:#f9f9f9; border-left:4px solid #c8a96e; padding:12px 16px;
        margin-bottom:24px; border-radius:0 8px 8px 0; font-size:14px; }
      .photo-block { page-break-inside:avoid; margin-bottom:20px;
        border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; }
      .photo-block img { width:100%; max-height:280px; object-fit:cover; display:block; }
      .caption { padding:10px 14px; font-size:13px; }
      .finding { padding:10px 0; border-bottom:1px solid #e5e7eb; }
      .finding strong { color:#c8a96e; }
      h2 { font-size:16px; margin:24px 0 12px; color:#1a1a2e; }
      @media print { body { padding:16px; } }
    </style></head><body>
    <h1>Store Visit Report</h1>
    <div class="meta">📍 ${branch} · ${v.visit_date} · By ${v.visitor?.full_name ?? "—"}</div>
    ${v.notes ? `<div class="note">${v.notes}</div>` : ""}
    ${photoFindings.length ? `<h2>Photos</h2>` + photoFindings.map(f => `
      <div class="photo-block">
        <img src="${f.image_url}"/>
        <div class="caption">${f.recommendation || "—"}</div>
      </div>`).join("") : ""}
    ${textFindings.length ? `<h2>Findings</h2>` + textFindings.map(f => `
      <div class="finding">
        <strong>🔍 ${f.finding}</strong>
        ${f.recommendation ? `<div style="color:#6b6880;margin-top:4px">💡 ${f.recommendation}</div>` : ""}
      </div>`).join("") : ""}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;

    printHTML(html);
  };

  const convertToTask = async (finding) => {
    if (!finding.finding.trim() || finding.finding === "Photo") return;
    const { data } = await supabase.from("tasks")
      .insert({ company_id:company.id, branch_id:branchId,
        title:finding.finding, priority:"high",
        due_label:"This week", assigned_to:"all", created_by:profile.id })
      .select().single();
    if (data) {
      await supabase.from("visit_findings").update({ task_id:data.id }).eq("id", finding.id);
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
                onChange={e => setVisitDate(e.target.value)}/>
            </div>
          </div>
          <div style={S.lbl}>General Notes</div>
          <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
            placeholder="General observations…"
            value={notes} onChange={e => setNotes(e.target.value)}/>

          {/* Photo capture */}
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <button className="btnG" style={{ ...S.btnG, flex:1, textAlign:"center" }}
              onClick={() => { cameraRef.current.setAttribute("capture","environment"); cameraRef.current.click(); }}>
              📷 Take Photo
            </button>
            <button className="btnG" style={{ ...S.btnG, flex:1, textAlign:"center" }}
              onClick={() => { cameraRef.current.removeAttribute("capture"); cameraRef.current.click(); }}>
              🖼️ Upload Photo
            </button>
            <input ref={cameraRef} type="file" accept="image/*" multiple
              style={{ display:"none" }} onChange={handleFiles}/>
          </div>

          {/* Photos with comments */}
          {photos.map((p, i) => (
            <div key={i} style={{ marginBottom:12, border:`1px solid ${C.accentColor}18`,
              borderRadius:12, overflow:"hidden" }}>
              <div style={{ position:"relative" }}>
                <img src={p.url} alt="" style={{ width:"100%", maxHeight:180,
                  objectFit:"cover", display:"block" }}/>
                <button onClick={() => removePhoto(i)} style={{
                  position:"absolute", top:8, right:8, background:"#000a", border:"none",
                  color:"#fff", borderRadius:"50%", width:26, height:26, cursor:"pointer",
                  fontSize:13, display:"flex", alignItems:"center", justifyContent:"center",
                }}>✕</button>
              </div>
              <div style={{ padding:"8px 12px", background:C.surfaceHigh }}>
                <input style={{ ...S.inp, marginTop:0, marginBottom:0, background:C.surfaceColor }}
                  placeholder="Comment on this photo…"
                  value={p.comment} onChange={e => updatePhotoComment(i, e.target.value)}/>
              </div>
            </div>
          ))}

          <div style={{ ...S.h3, marginTop:8 }}>Findings & Recommendations</div>
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
                value={f.finding} onChange={e => updateFinding(i, "finding", e.target.value)}/>
              <input style={{ ...S.inp, marginTop:0, marginBottom:0 }}
                placeholder="Recommendation (optional)"
                value={f.recommendation} onChange={e => updateFinding(i, "recommendation", e.target.value)}/>
            </div>
          ))}
          <button className="btnG" style={{ ...S.btnG, fontSize:12, marginBottom:14 }}
            onClick={addFinding}>＋ Add Finding</button>
          <button className="btnP" style={{ ...S.btnP, width:"100%" }}
            onClick={saveVisit} disabled={saving}>
            {saving ? "Saving…" : "Submit Visit Report →"}
          </button>
        </div>
      )}

      {visits.length === 0 && !showForm && (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No visits recorded yet.</div>
      )}

      {visits.map(v => {
        const meta = STATUS_META[v.status] ?? STATUS_META.draft;
        const branch = branches.find(b => b.id === v.branch_id);
        const photoFindings = (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url);
        const textFindings  = (v.findings ?? []).filter(f => f.finding !== "Photo");
        return (
          <div key={v.id} style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>📍 {branch?.name ?? "—"}</div>
                <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
                  {v.visit_date} · by {v.visitor?.full_name ?? "—"}
                </div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700,
                  background:meta.color+"1c", color:meta.color, border:`1px solid ${meta.color}44` }}>
                  {meta.label}
                </span>
                <button className="btnG" style={{ ...S.btnG, fontSize:11, padding:"4px 10px" }}
                  onClick={() => printVisit(v)}>🖨️ Print</button>
                {onDeleteVisit && (
                  <button onClick={() => onDeleteVisit(v.id)}
                    style={{ background:"none", border:"none", color:"#f87171",
                      cursor:"pointer", fontSize:16, padding:"4px" }}>🗑️</button>
                )}
              </div>
            </div>

            {v.notes && (
              <div style={{ fontSize:13, padding:"8px 12px", background:C.surfaceHigh,
                borderRadius:8, marginBottom:10, lineHeight:1.5 }}>
                {v.notes}
              </div>
            )}

            {/* Photos */}
            {photoFindings.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                {photoFindings.map((f, i) => (
                  <div key={i} style={{ position:"relative" }}>
                    <img src={f.image_url} alt=""
                      style={{ width:80, height:80, objectFit:"cover", borderRadius:8,
                        border:`1px solid ${C.accentColor}22` }}/>
                    {f.recommendation && (
                      <div style={{ position:"absolute", bottom:0, left:0, right:0,
                        background:"#000b", color:"#fff", fontSize:9, padding:"2px 4px",
                        borderRadius:"0 0 8px 8px", textAlign:"center",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {f.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Text findings */}
            {textFindings.length > 0 && (
              <div>
                <div style={S.h3}>Findings ({textFindings.length})</div>
                {textFindings.map((f, i) => (
                  <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${C.accentColor}0a` }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>🔍 {f.finding}</div>
                    {f.recommendation && (
                      <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>💡 {f.recommendation}</div>
                    )}
                    {!f.task_id && (
                      <button onClick={() => convertToTask(f)}
                        style={{ ...S.btnG, fontSize:11, padding:"4px 10px", marginTop:6 }}
                        className="btnG">→ Convert to Task</button>
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