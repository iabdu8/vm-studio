import { compressImage } from "../../lib/imageCompression.js";
import { useState, useRef, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { notifyBranch } from "../../services/enterprise.service.js";
import { ReportView } from "../shared/ReportView.jsx";
import { CommentThread } from "../shared/CommentThread.jsx";
import { InfoBanner } from "../shared/InfoBanner.jsx";
import { toast } from "../shared/Toast.jsx";
import { printFloorWalkChecklist } from "../../lib/checklistReports.js";
import { ChecklistCard, ChecklistTable, StatusPill } from "../shared/ChecklistCard.jsx";

const STATUS_META = {
  draft:     { label:"In Progress", color:"#d4a82a" },
  submitted: { label:"Submitted", color:"#4ade80" },
  reviewed:  { label:"Reviewed",  color:"#818cf8" },
  closed:    { label:"Closed",    color:"#4ade80" },
};

// ── Main Component ────────────────────────────────────────────
// A visit/floor walk stays open ("draft") while more photos get added
// over time — it's one report until you tap Finish, not one report per photo.
export function StoreVisits({ company, branches, profile, visits, onVisitCreated, onDeleteVisit,
  floorWalks = [], onFloorWalkChanged, canCreateFloorWalk = true, canCreateVisit = true }) {
  const [activeTab,    setActiveTab]    = useState("visits");
  const [showForm,     setShowForm]     = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [openFwId,     setOpenFwId]     = useState(null);

  // ── Visit draft ──
  const [draftVisit,   setDraftVisit]   = useState(null); // store_visits row + findings
  const [branchId,     setBranchId]     = useState(branches[0]?.id ?? "");
  const [visitDate,    setVisitDate]    = useState(new Date().toISOString().slice(0,10));
  const [notes,        setNotes]        = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [finishing,    setFinishing]    = useState(false);
  const cameraRef = useRef();

  // ── Floor walk draft ──
  const [draftFw,      setDraftFw]      = useState(null);
  const [fwNote,        setFwNote]       = useState("");
  const [fwUploading,   setFwUploading]  = useState(false);
  const [fwFinishing,   setFwFinishing]  = useState(false);
  const fwCameraRef = useRef();

  useEffect(() => {
    if (!company?.id || !profile?.id) return;
    supabase.from("store_visits")
      .select("*, findings:visit_findings(*)")
      .eq("company_id", company.id).eq("visitor_id", profile.id).eq("status", "draft")
      .order("created_at", { ascending:false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDraftVisit(data);
          setBranchId(data.branch_id ?? branches[0]?.id ?? "");
          setVisitDate(data.visit_date ?? new Date().toISOString().slice(0,10));
          setNotes(data.notes ?? "");
        }
      });
    supabase.from("floor_walks")
      .select("*, photos:floor_walk_photos(*)")
      .eq("company_id", company.id).eq("added_by", profile.id).eq("status", "draft")
      .order("created_at", { ascending:false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) { setDraftFw(data); setFwNote(data.note ?? ""); } });
  }, [company?.id, profile?.id]);

  // ── Visit: ensure a draft row exists, create one on first use ──
  const ensureVisit = async () => {
    if (draftVisit) return draftVisit;
    const { data } = await supabase
      .from("store_visits")
      .insert({ company_id:company.id, branch_id:branchId, visitor_id:profile.id,
        visit_date:visitDate, notes, status:"draft" })
      .select("*, findings:visit_findings(*)").single();
    setDraftVisit(data);
    return data;
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const visit = await ensureVisit();
      for (const file of files) {
        const compressed = await compressImage(file, "visit");
        const safeName = (compressed?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${company.id}/visits/${visit.id}-${Date.now()}-${safeName}`;
        await supabase.storage.from("vm-photos").upload(path, compressed);
        const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
        const { data: finding } = await supabase.from("visit_findings")
          .insert({ visit_id:visit.id, finding:"Photo", image_url:url, recommendation:"" })
          .select().single();
        setDraftVisit(v => ({ ...v, findings: [...(v.findings ?? []), finding] }));
      }
    } finally { setUploading(false); }
  };

  const updateVisitPhotoComment = async (findingId, val) => {
    setDraftVisit(v => ({ ...v, findings: v.findings.map(f => f.id===findingId ? {...f, recommendation:val} : f) }));
    await supabase.from("visit_findings").update({ recommendation: val }).eq("id", findingId);
  };

  const removeVisitPhoto = async (findingId) => {
    await supabase.from("visit_findings").delete().eq("id", findingId);
    setDraftVisit(v => ({ ...v, findings: v.findings.filter(f => f.id !== findingId) }));
  };

  const saveVisitField = async (field, value) => {
    if (!draftVisit) return;
    await supabase.from("store_visits").update({ [field]: value }).eq("id", draftVisit.id);
    setDraftVisit(v => ({ ...v, [field]: value }));
  };

  const finishVisit = async () => {
    const visit = await ensureVisit();
    setFinishing(true);
    try {
      await supabase.from("store_visits").update({ notes, status:"submitted" }).eq("id", visit.id);
      notifyBranch(company.id, visit.branch_id, "visit_created", "Store Visit Report 🚶",
        "A visit report was submitted for your branch");
      onVisitCreated?.();
      setDraftVisit(null);
      setNotes(""); setShowForm(false);
    } finally { setFinishing(false); }
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

  // ── Floor walk: ensure a draft row exists ──
  const ensureFloorWalk = async () => {
    if (draftFw) return draftFw;
    const { data, error } = await supabase.from("floor_walks")
      .insert({ company_id:company.id, added_by:profile.id, branch_id: profile.branch_id ?? null, note:fwNote, manager:profile.full_name,
        date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }), status:"draft" })
      .select("*, photos:floor_walk_photos(*)").single();
    if (error) throw error;
    setDraftFw(data);
    return data;
  };

  const handleFwFiles = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (!files.length) return;
    setFwUploading(true);
    try {
      const fw = await ensureFloorWalk();
      for (const file of files) {
        const compressed = await compressImage(file, "floorWalk");
        const safeName = (compressed?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${company.id}/floorwalk/${fw.id}-${Date.now()}-${safeName}`;
        await supabase.storage.from("vm-photos").upload(path, compressed);
        const url = supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
        const { data: photo, error: photoErr } = await supabase.from("floor_walk_photos")
          .insert({ floor_walk_id:fw.id, url, comment:"" }).select().single();
        if (photoErr) throw photoErr;
        setDraftFw(f => ({ ...f, photos: [...(f.photos ?? []), photo] }));
      }
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to add photo. Please try again.");
    } finally { setFwUploading(false); }
  };

  const updateFwPhotoComment = async (photoId, val) => {
    setDraftFw(f => ({ ...f, photos: f.photos.map(p => p.id===photoId ? {...p, comment:val} : p) }));
    await supabase.from("floor_walk_photos").update({ comment: val }).eq("id", photoId);
  };

  const removeFwPhoto = async (photoId) => {
    await supabase.from("floor_walk_photos").delete().eq("id", photoId);
    setDraftFw(f => ({ ...f, photos: f.photos.filter(p => p.id !== photoId) }));
  };

  const finishFloorWalk = async () => {
    setFwFinishing(true);
    try {
      const fw = await ensureFloorWalk();
      const { error } = await supabase.from("floor_walks").update({ note:fwNote, status:"submitted" }).eq("id", fw.id);
      if (error) throw error;
      onFloorWalkChanged?.();
      if (profile.branch_id) notifyBranch(company.id, profile.branch_id, "visit_created", "New Floor Walk 🚶", "Manager published a new floor walk");
      setDraftFw(null);
      setFwNote(""); setShowForm(false);
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to finish floor walk. Please try again.");
    } finally { setFwFinishing(false); }
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

      <InfoBanner>
        {canCreateFloorWalk && canCreateVisit
          ? "Both are your own reports — Floor Walks get published to every branch for everyone to see and comment on; Store Visits stay in your own log."
          : canCreateFloorWalk
          ? "Floor Walks here are yours to publish — every branch sees and can comment on them. Store Visits are the VM Manager's own log — you can view and comment, not create."
          : "Floor Walks here are published by the VM Manager to every branch — you can view and comment. Store Visits are the VM Manager's own on-the-ground log."}
      </InfoBanner>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["visits","🚶 Store Visits"],["floor","📋 Floor Walks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(activeTab===k)} onClick={() => { setActiveTab(k); setShowForm(false); }}>{l}</button>
        ))}
      </div>

      {/* ── VISITS TAB ── */}
      {activeTab === "visits" && (
        <>
          {canCreateVisit && (
            <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
              onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : draftVisit ? "▶ Continue Visit Report" : "＋ New Visit Report"}
            </button>
          )}

          {canCreateVisit && showForm && (
            <div style={S.card}>
              <div style={S.h3}>Visit Details</div>
              {draftVisit && (
                <div style={{ fontSize:11, color:"#d4a82a", marginBottom:10 }}>
                  🟡 In progress — keep adding photos, then tap Finish when done.
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={S.lbl}>Branch</div>
                  <select style={S.sel} value={branchId}
                    onChange={e => { setBranchId(e.target.value); if (draftVisit) saveVisitField("branch_id", e.target.value); }}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.lbl}>Visit Date</div>
                  <input style={S.inp} type="date" value={visitDate}
                    onChange={e => { setVisitDate(e.target.value); if (draftVisit) saveVisitField("visit_date", e.target.value); }}/>
                </div>
              </div>
              <div style={S.lbl}>General Notes</div>
              <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
                placeholder="General observations…" value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={e => draftVisit && saveVisitField("notes", e.target.value)}/>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <button className="btnG" style={{ ...S.btnG, flex:1 }} disabled={uploading}
                  onClick={() => { cameraRef.current.setAttribute("capture","environment"); cameraRef.current.click(); }}>
                  📷 Take Photo
                </button>
                <button className="btnG" style={{ ...S.btnG, flex:1 }} disabled={uploading}
                  onClick={() => { cameraRef.current.removeAttribute("capture"); cameraRef.current.click(); }}>
                  🖼️ Upload Photo
                </button>
                <input ref={cameraRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={handleFiles}/>
              </div>
              {uploading && <div style={{ ...S.muted, fontSize:12, marginBottom:10 }}>Uploading…</div>}
              {(draftVisit?.findings ?? []).filter(f => f.finding === "Photo").map(p => (
                <div key={p.id} style={{ marginBottom:12, border:`1px solid ${C.accentColor}18`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ position:"relative" }}>
                    <img loading="lazy" src={p.image_url} alt="" style={{ width:"100%", maxHeight:180, objectFit:"cover", display:"block" }}/>
                    <button onClick={() => removeVisitPhoto(p.id)} style={{ position:"absolute", top:8, right:8,
                      background:"#000a", border:"none", color:"#fff", borderRadius:"50%",
                      width:26, height:26, cursor:"pointer", fontSize:13 }}>✕</button>
                  </div>
                  <div style={{ padding:"8px 12px", background:C.surfaceHigh }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.mutedColor, letterSpacing:.5, textTransform:"uppercase", marginBottom:4 }}>Comment</div>
                    <input style={{ ...S.inp, marginTop:0, marginBottom:0, background:"var(--clr-surface)" }}
                      placeholder="Comment on this photo…" defaultValue={p.recommendation ?? ""}
                      onBlur={e => updateVisitPhotoComment(p.id, e.target.value)}/>
                  </div>
                </div>
              ))}
              <button className="btnP" style={{ ...S.btnP, width:"100%" }}
                onClick={finishVisit} disabled={finishing || uploading}>
                {finishing ? "Finishing…" : "✓ Finish Report →"}
              </button>
            </div>
          )}

          {visits.length === 0 && !showForm && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚶</div>
              <div style={{ ...S.muted }}>No visits recorded yet.</div>
            </div>
          )}

          {visits.map(v => {
            const meta = STATUS_META[v.status] ?? STATUS_META.draft;
            const branch = branches.find(b => b.id === v.branch_id);
            const photoCount   = (v.findings ?? []).filter(f => f.finding === "Photo").length;
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
                      {findingCount > 0 && <span style={{ fontSize:11, color:C.mutedColor }}>🔍 {findingCount} observations</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ padding:"3px 10px", borderRadius:12, fontSize:11, fontWeight:700,
                      background:meta.color+"1c", color:meta.color, border:`1px solid ${meta.color}44` }}>
                      {meta.label}
                    </span>
                    {onDeleteVisit && (
                      <button onClick={e => { e.stopPropagation(); onDeleteVisit(v.id); }}
                        style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:16, padding:"4px" }}>🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── FLOOR WALK TAB ── */}
      {activeTab === "floor" && (
        <div>
          {!canCreateFloorWalk && (
            <div style={{ ...S.muted, fontSize:12, marginBottom:16 }}>
              View-only — floor walks are published by the VM Manager. Leave feedback via comments.
            </div>
          )}

          {canCreateFloorWalk && (
            <button className="btnP" style={{ ...S.btnP, marginBottom:16 }}
              onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : draftFw ? "▶ Continue Floor Walk" : "＋ New Floor Walk"}
            </button>
          )}

          {canCreateFloorWalk && showForm && (
            <div style={S.card}>
              <div style={S.h3}>Floor Walk Details</div>
              {draftFw && (
                <div style={{ fontSize:11, color:"#d4a82a", marginBottom:10 }}>
                  🟡 In progress — keep adding photos, then tap Finish when done.
                </div>
              )}
              <div style={S.lbl}>Notes / Instructions</div>
              <textarea style={{ ...S.inp, minHeight:72, resize:"vertical" }}
                placeholder="Floor walk instructions..." value={fwNote}
                onChange={e => setFwNote(e.target.value)}
                onBlur={e => draftFw && supabase.from("floor_walks").update({ note:e.target.value }).eq("id", draftFw.id)}/>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <button className="btnG" style={{ ...S.btnG, flex:1 }} disabled={fwUploading}
                  onClick={() => { fwCameraRef.current.setAttribute("capture","environment"); fwCameraRef.current.click(); }}>
                  📷 Take Photo
                </button>
                <button className="btnG" style={{ ...S.btnG, flex:1 }} disabled={fwUploading}
                  onClick={() => { fwCameraRef.current.removeAttribute("capture"); fwCameraRef.current.click(); }}>
                  🖼️ Upload
                </button>
                <input ref={fwCameraRef} type="file" accept="image/*" multiple
                  style={{ display:"none" }} onChange={handleFwFiles}/>
              </div>
              {fwUploading && <div style={{ ...S.muted, fontSize:12, marginBottom:10 }}>Uploading…</div>}
              {(draftFw?.photos ?? []).filter(Boolean).map(p => (
                <div key={p.id} style={{ marginBottom:10, border:`1px solid ${C.accentColor}18`, borderRadius:10, overflow:"hidden" }}>
                  <div style={{ position:"relative" }}>
                    <img loading="lazy" src={p.url} alt="" style={{ width:"100%", maxHeight:160, objectFit:"cover", display:"block" }}/>
                    <button onClick={() => removeFwPhoto(p.id)} style={{ position:"absolute", top:8, right:8,
                      background:"#000a", border:"none", color:"#fff", borderRadius:"50%",
                      width:26, height:26, cursor:"pointer", fontSize:13 }}>✕</button>
                  </div>
                  <div style={{ padding:"8px 12px", background:C.surfaceHigh }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.mutedColor, letterSpacing:.5, textTransform:"uppercase", marginBottom:4 }}>Comment</div>
                    <input style={{ ...S.inp, marginTop:0, marginBottom:0, background:"var(--clr-surface)" }}
                      placeholder="Comment on this photo…" defaultValue={p.comment ?? ""}
                      onBlur={e => updateFwPhotoComment(p.id, e.target.value)}/>
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8 }}>
                <button className="btnP" style={{ ...S.btnP, flex:1 }} onClick={finishFloorWalk} disabled={fwFinishing || fwUploading}>
                  {fwFinishing ? "Finishing…" : "✓ Finish Floor Walk →"}
                </button>
              </div>
            </div>
          )}

          {floorWalks.length === 0 && !showForm && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ ...S.muted }}>No floor walks yet.</div>
            </div>
          )}

          {floorWalks.map((fw, i) => {
            const points = (fw.note ?? "").split("\n").map(l => l.trim()).filter(Boolean);
            const photoCount = fw.photos?.length ?? 0;
            const dayName = fw.date ? new Date(fw.date).toLocaleDateString("en-GB", { weekday:"long" }) : "";
            return (
            <ChecklistCard key={fw.id ?? i}
              eyebrow={branches.find(b => b.id === fw.branch_id)?.name ?? branches[0]?.name ?? ""}
              title={`📋 Floor Walk — ${fw.manager ?? ""}`}
              badge={dayName} badgeColor={C.accentColor}
              meta={fw.date ?? ""}
              kpis={[{ n: points.length, l:"Points" }, { n: photoCount, l:"Photos" }]}
            >
              {points.length > 0 && (
                <ChecklistTable columns={["#","Check Point","Status"]}>
                  {points.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}>{idx+1}</td>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}>{p}</td>
                      <td style={{ padding:"8px 12px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)` }}><StatusPill status="done"/></td>
                    </tr>
                  ))}
                </ChecklistTable>
              )}
              <div style={{ display:"flex", gap:14, marginTop:12 }}>
                <button onClick={() => setActiveReport({
                  type:"Floor Walk Report",
                  title:`Floor Walk — ${fw.manager ?? ""}`,
                  branch: branches.find(b => b.id === fw.branch_id)?.name ?? branches[0]?.name ?? "",
                  date: fw.date ?? "",
                  by: fw.manager ?? "—",
                  notes: fw.note,
                  photos: (fw.photos ?? []).map(p => ({ image_url: p.url ?? p, recommendation: p.comment ?? "" })),
                  findings: [],
                })} style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                  📷 View Photos
                </button>
                {fw.id && (
                  <button onClick={() => setOpenFwId(openFwId === fw.id ? null : fw.id)}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                      fontSize:11, fontWeight:600, padding:0 }}>
                    {openFwId === fw.id ? "Hide comments" : "💬 Comments"}
                  </button>
                )}
                <button onClick={() => printFloorWalkChecklist(fw, company)}
                  style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                    fontSize:11, fontWeight:600, padding:0 }}>
                  🖨️ Print Checklist
                </button>
              </div>
              {fw.id && openFwId === fw.id && <CommentThread floorWalkId={fw.id} profile={profile} />}
            </ChecklistCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
