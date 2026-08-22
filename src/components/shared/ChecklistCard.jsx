import { S, C } from "../../styles/theme.js";

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
