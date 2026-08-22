import { compressImage } from "../../lib/imageCompression.js";
import { useState, useRef, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { notifyBranch } from "../../services/enterprise.service.js";
import { CommentThread } from "../shared/CommentThread.jsx";
import { InfoBanner } from "../shared/InfoBanner.jsx";
import { toast } from "../shared/Toast.jsx";
import { PhotoLightbox } from "../shared/PhotoLightbox.jsx";
import { printFloorWalkChecklist, printVisitChecklist } from "../../lib/checklistReports.js";
import { ChecklistCard, ChecklistItemRow, DEFAULT_CHECKLIST } from "../shared/ChecklistCard.jsx";

const STATUS_META = {
  draft:     { label:"In Progress", color:"#d4a82a" },
  submitted: { label:"Submitted", color:"#4ade80" },
  reviewed:  { label:"Reviewed",  color:"#818cf8" },
  closed:    { label:"Closed",    color:"#4ade80" },
};

async function uploadToStorage(companyId, folder, id, file, preset) {
  const compressed = await compressImage(file, preset);
  const safeName = (compressed?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${companyId}/${folder}/${id}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("vm-photos").upload(path, compressed);
  if (error) throw error;
  return supabase.storage.from("vm-photos").getPublicUrl(path).data.publicUrl;
}

// ── Main Component ────────────────────────────────────────────
// A visit/floor walk stays open ("draft") while more photos get added
// over time — it's one report until you tap Finish, not one report per photo.
export function StoreVisits({ company, branches, profile, visits, onVisitCreated, onDeleteVisit,
  floorWalks = [], onFloorWalkChanged, onDeleteFloorWalk, canCreateFloorWalk = true, canCreateVisit = true }) {
  const [activeTab,    setActiveTab]    = useState("visits");
  const [showForm,     setShowForm]     = useState(false);
  const [openReportKey, setOpenReportKey] = useState(null); // { kind, id } for expanded card view
  const [openFwId,     setOpenFwId]     = useState(null);
  const [openVisitId,  setOpenVisitId]  = useState(null);
  const [lightbox,     setLightbox]     = useState(null); // { photos, index }

  // ── Visit draft ──
  const [draftVisit,   setDraftVisit]   = useState(null);
  const [branchId,     setBranchId]     = useState(branches[0]?.id ?? "");
  const [visitDate,    setVisitDate]    = useState(new Date().toISOString().slice(0,10));
  const [notes,        setNotes]        = useState("");
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [finishing,    setFinishing]    = useState(false);

  // ── Floor walk draft ──
  const [draftFw,      setDraftFw]      = useState(null);
  const [fwNote,        setFwNote]       = useState("");
  const [fwUploadingIdx,setFwUploadingIdx] = useState(null);
  const [fwFinishing,   setFwFinishing]  = useState(false);

  useEffect(() => {
    if (!company?.id || !profile?.id) return;
    supabase.from("store_visits")
      .select("*")
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
      .select("*")
      .eq("company_id", company.id).eq("added_by", profile.id).eq("status", "draft")
      .order("created_at", { ascending:false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data) { setDraftFw(data); setFwNote(data.note ?? ""); } });
  }, [company?.id, profile?.id]);

  // ════════════════════════════════════════════════════════════
  //  VISITS
  // ════════════════════════════════════════════════════════════
  const ensureVisit = async () => {
    if (draftVisit) return draftVisit;
    const { data, error } = await supabase
      .from("store_visits")
      .insert({ company_id:company.id, branch_id:branchId, visitor_id:profile.id,
        visit_date:visitDate, notes, status:"draft", checklist: DEFAULT_CHECKLIST })
      .select("*").single();
    if (error) throw error;
    setDraftVisit(data);
    return data;
  };

  const toggleVisitItem = async (idx) => {
    const v = await ensureVisit();
    const list = v.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, status: it.status === "done" ? "pending" : "done" } : it);
    setDraftVisit(f => ({ ...f, checklist: next }));
    await supabase.from("store_visits").update({ checklist: next }).eq("id", v.id);
  };

  const addVisitItemPhotos = async (idx, files) => {
    setUploadingIdx(idx);
    try {
      const v = await ensureVisit();
      const urls = [];
      for (const file of files) urls.push(await uploadToStorage(company.id, "visits", v.id, file, "visit"));
      setDraftVisit(f => {
        const list = f.checklist ?? DEFAULT_CHECKLIST;
        const next = list.map((it, i) => i === idx ? { ...it, photos: [...(it.photos ?? []), ...urls.map(url => ({ url }))] } : it);
        supabase.from("store_visits").update({ checklist: next }).eq("id", v.id);
        return { ...f, checklist: next };
      });
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to add photo. Please try again.");
    } finally { setUploadingIdx(null); }
  };

  const removeVisitItemPhoto = async (idx, photoIdx) => {
    const v = await ensureVisit();
    const list = v.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, photos: it.photos.filter((_, pi) => pi !== photoIdx) } : it);
    setDraftVisit(f => ({ ...f, checklist: next }));
    await supabase.from("store_visits").update({ checklist: next }).eq("id", v.id);
  };

  const updateVisitItemComment = async (idx, val) => {
    const v = await ensureVisit();
    const list = v.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, note: val } : it);
    setDraftVisit(f => ({ ...f, checklist: next }));
    await supabase.from("store_visits").update({ checklist: next }).eq("id", v.id);
  };

  const finishVisit = async () => {
    setFinishing(true);
    try {
      const v = await ensureVisit();
      const { error } = await supabase.from("store_visits").update({ notes, status:"submitted" }).eq("id", v.id);
      if (error) throw error;
      notifyBranch(company.id, v.branch_id, "visit_created", "Store Visit Report 🚶",
        "A visit report was submitted for your branch");
      onVisitCreated?.();
      setDraftVisit(null);
      setNotes(""); setShowForm(false);
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to finish visit. Please try again.");
    } finally { setFinishing(false); }
  };

  // ════════════════════════════════════════════════════════════
  //  FLOOR WALKS
  // ════════════════════════════════════════════════════════════
  const ensureFloorWalk = async () => {
    if (draftFw) return draftFw;
    const { data, error } = await supabase.from("floor_walks")
      .insert({ company_id:company.id, added_by:profile.id, branch_id: profile.branch_id ?? null, note:fwNote, manager:profile.full_name,
        date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }), status:"draft",
        checklist: DEFAULT_CHECKLIST })
      .select("*").single();
    if (error) throw error;
    setDraftFw(data);
    return data;
  };

  const toggleFwItem = async (idx) => {
    const fw = await ensureFloorWalk();
    const list = fw.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, status: it.status === "done" ? "pending" : "done" } : it);
    setDraftFw(f => ({ ...f, checklist: next }));
    await supabase.from("floor_walks").update({ checklist: next }).eq("id", fw.id);
  };

  const addFwItemPhotos = async (idx, files) => {
    setFwUploadingIdx(idx);
    try {
      const fw = await ensureFloorWalk();
      const urls = [];
      for (const file of files) urls.push(await uploadToStorage(company.id, "floorwalk", fw.id, file, "floorWalk"));
      setDraftFw(f => {
        const list = f.checklist ?? DEFAULT_CHECKLIST;
        const next = list.map((it, i) => i === idx ? { ...it, photos: [...(it.photos ?? []), ...urls.map(url => ({ url }))] } : it);
        supabase.from("floor_walks").update({ checklist: next }).eq("id", fw.id);
        return { ...f, checklist: next };
      });
    } catch (e) {
      process.env?.NODE_ENV !== "production" && console.error(e);
      toast("Failed to add photo. Please try again.");
    } finally { setFwUploadingIdx(null); }
  };

  const removeFwItemPhoto = async (idx, photoIdx) => {
    const fw = await ensureFloorWalk();
    const list = fw.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, photos: it.photos.filter((_, pi) => pi !== photoIdx) } : it);
    setDraftFw(f => ({ ...f, checklist: next }));
    await supabase.from("floor_walks").update({ checklist: next }).eq("id", fw.id);
  };

  const updateFwItemComment = async (idx, val) => {
    const fw = await ensureFloorWalk();
    const list = fw.checklist ?? DEFAULT_CHECKLIST;
    const next = list.map((it, i) => i === idx ? { ...it, note: val } : it);
    setDraftFw(f => ({ ...f, checklist: next }));
    await supabase.from("floor_walks").update({ checklist: next }).eq("id", fw.id);
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

  const allPhotosOf = (checklist) => (checklist ?? []).flatMap(it => it.photos ?? []);

  return (
    <div>
      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} index={lightbox.index}
          onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(p => ({ ...p, index:i }))}/>
      )}

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
                  🟡 In progress — tap each point below, then Finish when done.
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={S.lbl}>Branch</div>
                  <select style={S.sel} value={branchId}
                    onChange={e => { setBranchId(e.target.value); if (draftVisit) supabase.from("store_visits").update({ branch_id:e.target.value }).eq("id", draftVisit.id); }}>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.lbl}>Visit Date</div>
                  <input style={S.inp} type="date" value={visitDate}
                    onChange={e => { setVisitDate(e.target.value); if (draftVisit) supabase.from("store_visits").update({ visit_date:e.target.value }).eq("id", draftVisit.id); }}/>
                </div>
              </div>

              <div style={S.lbl}>Checklist — tap to mark done, add photos per point</div>
              <div style={{ marginBottom:14 }}>
                {(draftVisit?.checklist ?? DEFAULT_CHECKLIST).map((item, idx) => (
                  <ChecklistItemRow key={idx} index={idx} item={item} editable
                    uploading={uploadingIdx === idx}
                    onToggle={() => toggleVisitItem(idx)}
                    onAddPhoto={(files) => addVisitItemPhotos(idx, files)}
                    onRemovePhoto={(pi) => removeVisitItemPhoto(idx, pi)}
                    onCommentChange={(val) => updateVisitItemComment(idx, val)}
                  />
                ))}
              </div>

              <div style={S.lbl}>General Notes</div>
              <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
                placeholder="Anything else worth noting…" value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={e => draftVisit && supabase.from("store_visits").update({ notes:e.target.value }).eq("id", draftVisit.id)}/>

              <button className="btnP" style={{ ...S.btnP, width:"100%" }}
                onClick={finishVisit} disabled={finishing || uploadingIdx !== null}>
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
            const checklist = v.checklist ?? [];
            const doneCount = checklist.filter(it => it.status === "done").length;
            const photos = allPhotosOf(checklist);
            const branch = branches.find(b => b.id === v.branch_id);
            const meta = STATUS_META[v.status] ?? STATUS_META.draft;
            return (
              <ChecklistCard key={v.id}
                eyebrow={branch?.name ?? "—"}
                title={`🚶 Store Visit — ${v.visitor?.full_name ?? profile?.full_name ?? ""}`}
                badge={meta.label} badgeColor={meta.color}
                meta={v.visit_date}
                kpis={[
                  { n: `${doneCount}/${checklist.length || 9}`, l:"Checked" },
                  { n: photos.length, l:"Photos" },
                ]}
              >
                {checklist.length > 0 && (
                  <div>
                    {(openReportKey?.kind === "visit" && openReportKey.id === v.id ? checklist : checklist.slice(0, 3)).map((it, idx) => (
                      <ChecklistItemRow key={idx} index={idx} item={it} editable={false}
                        onPhotoClick={(photos, pi) => setLightbox({ photos: photos.map(p => ({ url:p.url })), index: pi })}/>
                    ))}
                  </div>
                )}
                {v.notes && (
                  <div style={{ marginTop:10, fontSize:12, color:C.mutedColor, lineHeight:1.6 }}>
                    <strong style={{ color:C.textColor }}>Notes:</strong> {v.notes}
                  </div>
                )}
                <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
                  {checklist.length > 3 && (
                    <button onClick={() => setOpenReportKey(openReportKey?.id === v.id ? null : { kind:"visit", id:v.id })}
                      style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                      {openReportKey?.kind === "visit" && openReportKey.id === v.id ? "Show less" : `Show all ${checklist.length} points →`}
                    </button>
                  )}
                  <button onClick={() => setOpenVisitId(openVisitId === v.id ? null : v.id)}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    {openVisitId === v.id ? "Hide comments" : "💬 Comments"}
                  </button>
                  <button onClick={() => printVisitChecklist(v, branch?.name, company)}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    🖨️ Print Checklist
                  </button>
                  {onDeleteVisit && (
                    <button onClick={() => onDeleteVisit(v.id)}
                      style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
                {openVisitId === v.id && <CommentThread visitId={v.id} profile={profile} />}
              </ChecklistCard>
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
                  🟡 In progress — tap each point below, then Finish when done.
                </div>
              )}

              <div style={S.lbl}>Checklist — tap to mark done, add photos per point</div>
              <div style={{ marginBottom:14 }}>
                {(draftFw?.checklist ?? DEFAULT_CHECKLIST).map((item, idx) => (
                  <ChecklistItemRow key={idx} index={idx} item={item} editable
                    uploading={fwUploadingIdx === idx}
                    onToggle={() => toggleFwItem(idx)}
                    onAddPhoto={(files) => addFwItemPhotos(idx, files)}
                    onRemovePhoto={(pi) => removeFwItemPhoto(idx, pi)}
                    onCommentChange={(val) => updateFwItemComment(idx, val)}
                  />
                ))}
              </div>

              <div style={S.lbl}>Notes / Additional Points</div>
              <textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }}
                placeholder="Anything else worth noting…" value={fwNote}
                onChange={e => setFwNote(e.target.value)}
                onBlur={e => draftFw && supabase.from("floor_walks").update({ note:e.target.value }).eq("id", draftFw.id)}/>

              <button className="btnP" style={{ ...S.btnP, width:"100%" }}
                onClick={finishFloorWalk} disabled={fwFinishing || fwUploadingIdx !== null}>
                {fwFinishing ? "Finishing…" : "✓ Finish Floor Walk →"}
              </button>
            </div>
          )}

          {floorWalks.length === 0 && !showForm && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ ...S.muted }}>No floor walks yet.</div>
            </div>
          )}

          {floorWalks.map((fw, i) => {
            const checklist = fw.checklist ?? [];
            const doneCount = checklist.filter(it => it.status === "done").length;
            const photos = allPhotosOf(checklist);
            const extraPoints = (fw.note ?? "").split("\n").map(l => l.trim()).filter(Boolean);
            const dayName = fw.date ? new Date(fw.date).toLocaleDateString("en-GB", { weekday:"long" }) : "";
            const isOpen = openReportKey?.kind === "floor" && openReportKey.id === (fw.id ?? i);
            return (
            <ChecklistCard key={fw.id ?? i}
              eyebrow={branches.find(b => b.id === fw.branch_id)?.name ?? branches[0]?.name ?? ""}
              title={`📋 Floor Walk — ${fw.manager ?? ""}`}
              badge={dayName} badgeColor={C.accentColor}
              meta={fw.date ?? ""}
              kpis={[
                { n: `${doneCount}/${checklist.length || 9}`, l:"Checked" },
                { n: photos.length, l:"Photos" },
              ]}
            >
              {checklist.length > 0 && (
                <div>
                  {(isOpen ? checklist : checklist.slice(0, 3)).map((it, idx) => (
                    <ChecklistItemRow key={idx} index={idx} item={it} editable={false}
                      onPhotoClick={(photos, pi) => setLightbox({ photos: photos.map(p => ({ url:p.url })), index: pi })}/>
                  ))}
                </div>
              )}
              {extraPoints.length > 0 && (
                <div style={{ marginTop:10, fontSize:12, color:C.mutedColor, lineHeight:1.6 }}>
                  <strong style={{ color:C.textColor }}>Notes:</strong> {extraPoints.join(" · ")}
                </div>
              )}
              <div style={{ display:"flex", gap:14, marginTop:12, flexWrap:"wrap" }}>
                {checklist.length > 3 && (
                  <button onClick={() => setOpenReportKey(isOpen ? null : { kind:"floor", id: fw.id ?? i })}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    {isOpen ? "Show less" : `Show all ${checklist.length} points →`}
                  </button>
                )}
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
                {onDeleteFloorWalk && fw.id && (
                  <button onClick={() => onDeleteFloorWalk(fw.id)}
                    style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    🗑️ Delete
                  </button>
                )}
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
