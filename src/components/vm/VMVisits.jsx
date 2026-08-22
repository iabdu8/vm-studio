import { useState, useEffect } from "react";
import { S, C } from "../../styles/theme.js";
import { supabase } from "../../lib/supabase.js";
import { InfoBanner } from "../shared/InfoBanner.jsx";
import { PhotoLightbox } from "../shared/PhotoLightbox.jsx";
import { printFloorWalkChecklist, printVisitChecklist } from "../../lib/checklistReports.js";
import { ChecklistCard, ChecklistItemRow } from "../shared/ChecklistCard.jsx";

export function VMVisits({ profile, floorWalks = [], company }) {
  const [visits,  setVisits]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [openKey,  setOpenKey]  = useState(null); // { kind, id }
  const [lightbox, setLightbox] = useState(null);
  const [tab, setTab] = useState("visits");

  const branchId   = profile?.branch_id ?? null;
  const branchName = profile?.branch?.name ?? "";

  useEffect(() => {
    if (!branchId || !profile?.company_id) { setLoading(false); return; }
    supabase
      .from("store_visits")
      .select("*, visitor:visitor_id(full_name)")
      .eq("company_id", profile.company_id)
      .eq("branch_id", branchId)
      .order("visit_date", { ascending: false })
      .limit(10)
      .then(({ data }) => { setVisits(data ?? []); setLoading(false); });
  }, [branchId]);

  const allPhotosOf = (checklist) => (checklist ?? []).flatMap(it => it.photos ?? []);

  if (loading) return <div style={{ ...S.muted, textAlign:"center", padding:40 }}>Loading…</div>;

  return (
    <div>
      {lightbox && (
        <PhotoLightbox photos={lightbox.photos} index={lightbox.index}
          onClose={() => setLightbox(null)} onIndexChange={i => setLightbox(p => ({ ...p, index:i }))}/>
      )}

      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Visits <span style={S.accent}>&amp; Floor Walks</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>{branchName}</div>

      <InfoBanner>Read-only reports from your VM Manager (Store Visits) and Head VM (Floor Walks) — tap "Show all points" to see the full checklist and photos.</InfoBanner>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        {[["visits","🚶 Store Visits"],["floor","📋 Floor Walks"]].map(([k,l]) => (
          <button key={k} className="tab-btn" style={S.tab(tab===k)} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Store Visits */}
      {tab === "visits" && (
        <>
          {visits.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🚶</div>
              <div style={{ ...S.muted }}>No visits recorded for your branch yet.</div>
            </div>
          )}
          {visits.map(v => {
            const checklist = v.checklist ?? [];
            const doneCount = checklist.filter(it => it.status === "done").length;
            const photos = allPhotosOf(checklist);
            const isOpen = openKey?.kind === "visit" && openKey.id === v.id;
            return (
              <ChecklistCard key={v.id}
                title={`🚶 Visit by ${v.visitor?.full_name ?? "—"}`}
                badge={v.status} badgeColor={v.status==="closed" ? "#4ade80" : "#d4a82a"}
                meta={v.visit_date}
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
                {v.notes && (
                  <div style={{ marginTop:10, fontSize:12, color:C.mutedColor, lineHeight:1.6 }}>
                    <strong style={{ color:C.textColor }}>Notes:</strong> {v.notes}
                  </div>
                )}
                <div style={{ display:"flex", gap:14, marginTop:12 }}>
                  {checklist.length > 3 && (
                    <button onClick={() => setOpenKey(isOpen ? null : { kind:"visit", id:v.id })}
                      style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                      {isOpen ? "Show less" : `Show all ${checklist.length} points →`}
                    </button>
                  )}
                  <button onClick={() => printVisitChecklist(v, branchName, company)}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    🖨️ Print Checklist
                  </button>
                </div>
              </ChecklistCard>
            );
          })}
        </>
      )}

      {/* Floor Walks */}
      {tab === "floor" && (
        <>
          {floorWalks.length === 0 && (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <div style={{ ...S.muted }}>No floor walks published yet.</div>
            </div>
          )}
          {floorWalks.map((fw, i) => {
            const checklist = fw.checklist ?? [];
            const doneCount = checklist.filter(it => it.status === "done").length;
            const photos = allPhotosOf(checklist);
            const extraPoints = (fw.note ?? "").split("\n").map(l => l.trim()).filter(Boolean);
            const dayName = fw.date ? new Date(fw.date).toLocaleDateString("en-GB", { weekday:"long" }) : "";
            const isOpen = openKey?.kind === "floor" && openKey.id === (fw.id ?? i);
            return (
            <ChecklistCard key={fw.id ?? i}
              title="📋 Floor Walk" badge={dayName} badgeColor={C.accentColor}
              meta={`By ${fw.manager ?? "—"} · ${fw.date ?? ""}`}
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
              <div style={{ display:"flex", gap:14, marginTop:12 }}>
                {checklist.length > 3 && (
                  <button onClick={() => setOpenKey(isOpen ? null : { kind:"floor", id: fw.id ?? i })}
                    style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer", fontSize:11, fontWeight:600, padding:0 }}>
                    {isOpen ? "Show less" : `Show all ${checklist.length} points →`}
                  </button>
                )}
                <button onClick={() => printFloorWalkChecklist(fw, company)}
                  style={{ background:"none", border:"none", color:C.accentColor, cursor:"pointer",
                    fontSize:11, fontWeight:600, padding:0 }}>
                  🖨️ Print Checklist
                </button>
              </div>
            </ChecklistCard>
            );
          })}
        </>
      )}
    </div>
  );
}
