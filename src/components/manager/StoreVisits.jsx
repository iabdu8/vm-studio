import React from "react";
import { ReportView } from "../shared/ReportView.jsx";
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

export function StoreVisits({ company, branches, profile, visits, onVisitCreated, onDeleteVisit, floorWalks = [], onAddFloorWalk }) {
  const [activeTab,  setActiveTab]  = useState("visits");
  const [showForm,   setShowForm]   = useState(false);
  const [branchId,   setBranchId]   = useState(branches[0]?.id ?? "");
  const [visitDate,  setVisitDate]  = useState(new Date().toISOString().slice(0,10));
  const [notes,      setNotes]      = useState("");
  const [photos,     setPhotos]     = useState([]);
  const [findings,   setFindings]   = useState([{ finding:"", recommendation:"" }]);
  const [saving,     setSaving]     = useState(false);
  const [activeReport, setActiveReport] = useState(null);
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
        for (const p of photos) {
          const safeName = (p.file?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${company.id}/visits/${visit.id}-${Date.now()}-${safeName}`;
          await supabase.storage.from("vm-photos").upload(path, p.file);
          const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
          await supabase.from("visit_findings")
            .insert({ visit_id:visit.id, finding:"Photo", image_url:url, recommendation:p.comment||"" });
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

  const openReport = (v) => {
    const branch = branches.find(b => b.id === v.branch_id);
    setActiveReport({
      type: "Store Visit Report",
      title: `Visit — ${branch?.name ?? "—"}`,
      branch: branch?.name ?? "—",
      date: v.visit_date,
      by: v.visitor?.full_name ?? "—",
      notes: v.notes,
      photos: (v.findings ?? []).filter(f => f.finding === "Photo" && f.image_url),
      findings: (v.findings ?? []).filter(f => f.finding !== "Photo"),
    });
  };

  return (
    <div>
      {activeReport && <ReportView report={activeReport} onClose={() => setActiveReport(null)}/>}

      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Store <span style={S.accent}>Visits</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Document and follow up on branch visits
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["visits","🚶 Store Visits"],["floor","📋 Floor Walks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(activeTab===k)} onClick={() => setActiveTab(k)}>{l}</button>
        ))}
      </div>

      {activeTab === "visits" && (
      <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
        onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "＋ New Visit Report"}
      </button>
      )}

      {activeTab === "visits" && showForm && (
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
            placeholder="General observations…" value={notes} onChange={e => setNotes(e.target.value)}/>

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
                <input style={{ ...S.inp, marginTop:0, marginBottom:0, background:"var(--clr-surface)" }}
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
                placeholder="What did you observe?" value={f.finding}
                onChange={e => updateFinding(i, "finding", e.target.value)}/>
              <input style={{ ...S.inp, marginTop:0, marginBottom:0 }}
                placeholder="Recommendation (optional)" value={f.recommendation}
                onChange={e => updateFinding(i, "recommendation", e.target.value)}/>
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

      {activeTab === "visits" && visits.length === 0 && !showForm && (
        <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No visits recorded yet.</div>
      )}

      {activeTab === "visits" && visits.map(v => {
        const meta = STATUS_META[v.status] ?? STATUS_META.draft;
        const branch = branches.find(b => b.id === v.branch_id);
        const photoCount = (v.findings ?? []).filter(f => f.finding === "Photo").length;
        const findingCount = (v.findings ?? []).filter(f => f.finding !== "Photo").length;
        return (
          <div key={v.id} style={{ ...S.card, cursor:"pointer" }} onClick={() => openReport(v)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>📍 {branch?.name ?? "—"}</div>
                <div style={{ ...S.muted, fontSize:12, marginTop:3 }}>
                  {v.visit_date} · by {v.visitor?.full_name ?? "—"}
                </div>
                <div style={{ display:"flex", gap:10, marginTop:6 }}>
                  {photoCount > 0 && <span style={{ fontSize:11, color:C.accentColor }}>📷 {photoCount} photos</span>}
                  {findingCount > 0 && <span style={{ fontSize:11, color:C.mutedColor }}>🔍 {findingCount} findings</span>}
                </div>
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700,
                  background:meta.color+"1c", color:meta.color, border:`1px solid ${meta.color}44` }}>
                  {meta.label}
                </span>
                {onDeleteVisit && (
                  <button onClick={e => { e.stopPropagation(); onDeleteVisit(v.id); }}
                    style={{ background:"none", border:"none", color:"#f87171",
                      cursor:"pointer", fontSize:16, padding:"4px" }}>🗑️</button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {/* Floor Walk Tab */}
      {activeTab === "floor" && (
        <div>
          <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
            onClick={() => setShowForm(f => !f)}>
            {showForm ? "Cancel" : "＋ New Floor Walk"}
          </button>

          {showForm && onAddFloorWalk && (() => {
            const FloorForm = () => {
              const [fNote, setFNote] = React.useState("");
              const [fPhotos, setFPhotos] = React.useState([]);
              const [fSaving, setFSaving] = React.useState(false);
              const camRef = React.useRef();
              const handleFiles = (e) => {
                const files = Array.from(e.target.files);
                setFPhotos(p => [...p, ...files.map(f => ({ file:f, url:URL.createObjectURL(f), comment:"" }))]);
                e.target.value = "";
              };
              const submit = async () => {
                setFSaving(true);
                await onAddFloorWalk({ note:fNote, photos:fPhotos });
                setFNote(""); setFPhotos([]); setShowForm(false);
                setFSaving(false);
              };
              return (
                <div style={S.card}>
                  <div style={S.h3}>Floor Walk Details</div>
                  <div style={S.lbl}>Notes / Instructions</div>
                  <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
                    placeholder="Floor walk instructions..." value={fNote} onChange={e => setFNote(e.target.value)}/>
                  <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                    <button className="btnG" style={{ ...S.btnG, flex:1 }}
                      onClick={() => { camRef.current.setAttribute("capture","environment"); camRef.current.click(); }}>
                      📷 Take Photo
                    </button>
                    <button className="btnG" style={{ ...S.btnG, flex:1 }}
                      onClick={() => { camRef.current.removeAttribute("capture"); camRef.current.click(); }}>
                      🖼️ Upload
                    </button>
                    <input ref={camRef} type="file" accept="image/*" multiple
                      style={{ display:"none" }} onChange={handleFiles}/>
                  </div>
                  {fPhotos.map((p, i) => (
                    <div key={i} style={{ marginBottom:10, border:`1px solid ${C.accentColor}18`, borderRadius:10, overflow:"hidden" }}>
                      <img src={p.url} alt="" style={{ width:"100%", maxHeight:160, objectFit:"cover", display:"block" }}/>
                      <div style={{ padding:"8px 12px", background:C.surfaceHigh }}>
                        <input style={{ ...S.inp, marginTop:0, marginBottom:0, background:"var(--clr-surface)" }}
                          placeholder="Comment..." value={p.comment}
                          onChange={e => setFPhotos(prev => prev.map((ph,idx) => idx===i ? {...ph,comment:e.target.value} : ph))}/>
                      </div>
                    </div>
                  ))}
                  <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={submit} disabled={fSaving}>
                    {fSaving ? "Publishing..." : "Publish Floor Walk →"}
                  </button>
                </div>
              );
            };
            return <FloorForm/>;
          })()}

          {floorWalks.length === 0 && !showForm && (
            <div style={{ ...S.muted, textAlign:"center", padding:30 }}>No floor walks yet.</div>
          )}

          {floorWalks.map((fw, i) => (
            <div key={i} style={{ ...S.card, cursor:"pointer" }} onClick={() => setActiveReport({
              type:"Floor Walk Report",
              title:`Floor Walk — ${fw.manager ?? ""}`,
              branch: branches[0]?.name ?? "",
              date: fw.date ?? "",
              by: fw.manager ?? "—",
              notes: fw.note,
              photos: (fw.photos ?? []).map(p => ({ image_url: p.url ?? p, recommendation: p.comment ?? "" })),
              findings: [],
            })}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>📋 Floor Walk</div>
                  <div style={{ ...S.muted, fontSize:12, marginTop:2 }}>By {fw.manager} · {fw.date ?? ""}</div>
                  {fw.photos?.length > 0 && (
                    <div style={{ fontSize:11, color:C.accentColor, marginTop:4 }}>📷 {fw.photos.length} photos</div>
                  )}
                </div>
                <span style={{ fontSize:11, color:C.accentColor }}>Tap to view →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}