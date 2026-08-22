import { useRef } from "react";
import { S, C } from "../../styles/theme.js";

// The standard daily walk-through checklist — same points for both
// Floor Walks and Store Visits.
export const DEFAULT_CHECKLIST = [
  "First 10M", "Recovery Status", "Gaps / Availability", "Min / Max Issues",
  "Pricing / Signage", "Marketing / Danglers", "VM Standards",
  "Customer Flow / Blocked Areas", "Pending Points from Yesterday",
].map(label => ({ label, status: "pending", note: "", photos: [] }));

// Dark-theme, on-screen version of the branded checklist look (colored
// day/status badge, KPI strip, status table) — same visual language as
// the printed reports, but native to the app so it doesn't only show
// up when you hit Print.

export function ChecklistCard({ eyebrow, title, badge, badgeColor, meta, kpis = [], children }) {
  const bColor = badgeColor ?? C.accentColor;
  return (
    <div style={{ ...S.card, borderTop: `3px solid ${bColor}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom: kpis.length || meta ? 12 : 0 }}>
        <div>
          {eyebrow && (
            <div style={{ fontSize:10, fontWeight:800, color:bColor, letterSpacing:1.5, textTransform:"uppercase", marginBottom:4 }}>
              {eyebrow}
            </div>
          )}
          <div style={{ ...S.dFont, fontSize:19, fontWeight:800 }}>{title}</div>
        </div>
        {badge && (
          <span style={{ flexShrink:0, padding:"6px 14px", borderRadius:8, fontSize:11, fontWeight:800,
            letterSpacing:.5, textTransform:"uppercase", background:bColor, color:"#fff" }}>
            {badge}
          </span>
        )}
      </div>

      {meta && <div style={{ ...S.muted, fontSize:12, marginBottom: kpis.length ? 12 : 0 }}>{meta}</div>}

      {kpis.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${kpis.length},1fr)`, gap:8, marginBottom:14 }}>
          {kpis.map(k => (
            <div key={k.l} style={{ textAlign:"center", padding:"10px 6px", background:C.surfaceHigh, borderRadius:10 }}>
              <div style={{ fontSize:18, fontWeight:800, color: k.color ?? bColor, lineHeight:1 }}>{k.n}</div>
              <div style={{ fontSize:9, fontWeight:700, color:C.mutedColor, letterSpacing:.5, textTransform:"uppercase", marginTop:3 }}>{k.l}</div>
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}

const PILL_META = {
  done:         { bg:"#4ade8022", color:"#4ade80", label:"✓ Done" },
  completed:    { bg:"#4ade8022", color:"#4ade80", label:"✓ Done" },
  pending:      { bg:"#d4a82a22", color:"#d4a82a", label:"Pending" },
  in_progress:  { bg:"#d4a82a22", color:"#d4a82a", label:"In Progress" },
  not_started:  { bg: C.mutedColor+"22", color:C.mutedColor, label:"Not Started" },
  cancelled:    { bg: C.mutedColor+"22", color:C.mutedColor, label:"Cancelled" },
};

export function StatusPill({ status }) {
  const m = PILL_META[status] ?? PILL_META.pending;
  return (
    <span style={{ padding:"3px 11px", borderRadius:12, fontSize:10, fontWeight:800, background:m.bg, color:m.color }}>
      {m.label}
    </span>
  );
}

// One checklist point — status pill (tap to toggle), optional photos,
// optional comment. `editable` shows the add-photo/comment controls;
// otherwise it's a clean read-only view for reports/print previews.
export function ChecklistItemRow({
  index, item, editable = false,
  onToggle, onAddPhoto, onRemovePhoto, onCommentChange, onPhotoClick, uploading = false,
}) {
  const fileRef = useRef();
  const photos = item.photos ?? [];
  const meta = PILL_META[item.status] ?? PILL_META.pending;

  return (
    <div style={{
      padding:"12px 4px", borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 8%, transparent)`,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ ...S.dFont, fontSize:12, fontWeight:800, color:C.mutedColor, width:18, flexShrink:0 }}>{index + 1}</span>
        <button onClick={editable ? onToggle : undefined}
          disabled={!editable}
          style={{ flex:1, textAlign:"left", background:"none", border:"none", cursor: editable ? "pointer" : "default",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:0 }}>
          <span style={{ fontSize:13, fontWeight:600, color: item.status==="done" ? C.mutedColor : C.textColor,
            textDecoration: item.status==="done" ? "line-through" : "none" }}>
            {item.label}
          </span>
          <span style={{ flexShrink:0, padding:"3px 11px", borderRadius:12, fontSize:10, fontWeight:800, background:meta.bg, color:meta.color }}>
            {meta.label}
          </span>
        </button>
      </div>

      {(photos.length > 0 || editable) && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8, paddingLeft:28 }}>
          {photos.map((p, pi) => (
            <div key={pi} style={{ position:"relative", cursor: onPhotoClick ? "pointer" : "default" }}
              onClick={() => onPhotoClick?.(photos, pi)}>
              <img loading="lazy" src={p.url ?? p} alt="" style={{ width:52, height:52, objectFit:"cover", borderRadius:7,
                border:`1px solid ${C.accentColor}22` }}/>
              {editable && (
                <button onClick={(e) => { e.stopPropagation(); onRemovePhoto?.(pi); }} style={{
                  position:"absolute", top:-5, right:-5, width:18, height:18, borderRadius:"50%",
                  background:"#000a", border:"none", color:"#fff", fontSize:10, cursor:"pointer", lineHeight:1 }}>✕</button>
              )}
            </div>
          ))}
          {editable && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ width:52, height:52, borderRadius:7, border:`1px dashed ${C.mutedColor}55`,
                background:"none", color:C.mutedColor, fontSize:18, cursor:"pointer" }}>
              {uploading ? "…" : "＋"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
            onChange={e => { const files = Array.from(e.target.files); e.target.value = ""; if (files.length) onAddPhoto?.(files); }}/>
        </div>
      )}

      {editable ? (
        <input placeholder="Comment on this point (optional)…" defaultValue={item.note ?? ""}
          onBlur={e => onCommentChange?.(e.target.value)}
          style={{ ...S.inp, marginTop:8, marginBottom:0, marginLeft:28, width:"calc(100% - 28px)",
            fontSize:12, padding:"7px 10px" }}/>
      ) : item.note ? (
        <div style={{ marginTop:6, marginLeft:28, fontSize:12, color:C.mutedColor, lineHeight:1.5 }}>{item.note}</div>
      ) : null}
    </div>
  );
}

// Simple bordered table matching the checklist look — pass rows as JSX <tr>s.
export function ChecklistTable({ columns, children }) {
  return (
    <div style={{ overflowX:"auto", border:`1px solid color-mix(in srgb, var(--clr-text) 12%, transparent)`, borderRadius:10 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:420 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c} style={{
                padding:"9px 12px", textAlign:"left", fontSize:9, fontWeight:800, color:C.mutedColor,
                letterSpacing:.5, textTransform:"uppercase", background:C.surfaceHigh,
                borderBottom:`1px solid color-mix(in srgb, var(--clr-text) 12%, transparent)`,
              }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
