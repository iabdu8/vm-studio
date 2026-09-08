export const DARK = {
  primaryColor: "#0d1117",
  accentColor:  "#0F766E",
  accentSoft:   "#0F766E1f",
  surfaceColor: "#151b23",
  surfaceHigh:  "#202833",
  textColor:    "#f4f7f8",
  mutedColor:   "#97a3ad",
};

export const LIGHT = {
  primaryColor: "#f6f8fa",
  accentColor:  "#0F766E",
  accentSoft:   "#0F766E17",
  surfaceColor: "#ffffff",
  surfaceHigh:  "#eef2f3",
  textColor:    "#172026",
  mutedColor:   "#66737d",
};

export const C = {
  primaryColor: "var(--clr-primary)",
  accentColor:  "var(--clr-accent)",
  accentSoft:   "var(--clr-accent-soft)",
  surfaceColor: "var(--clr-surface)",
  surfaceHigh:  "var(--clr-surface-high)",
  textColor:    "var(--clr-text)",
  mutedColor:   "var(--clr-muted)",
};

export const S = {
  app:  { minHeight:"100vh", background:"var(--clr-primary)", color:"var(--clr-text)", fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif", display:"flex", flexDirection:"column", paddingBottom:74 },
  main: { flex:1, padding:"20px 16px", maxWidth:1040, margin:"0 auto", width:"100%" },
  card: { background:"var(--clr-surface)", border:"1px solid color-mix(in srgb,var(--clr-muted) 18%,transparent)", borderRadius:8, padding:"18px 20px", marginBottom:14, boxShadow:"0 1px 2px color-mix(in srgb,#000 10%,transparent)" },
  loginBg:   { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--clr-primary)" },
  loginCard: { background:"var(--clr-surface)", borderRadius:10, padding:"32px 36px", width:390, border:"1px solid color-mix(in srgb,var(--clr-muted) 18%,transparent)", boxShadow:"0 20px 50px #00000030" },
  topBar:    { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 18px", background:"color-mix(in srgb,var(--clr-surface) 94%,transparent)", backdropFilter:"blur(14px)", borderBottom:"1px solid color-mix(in srgb,var(--clr-muted) 16%,transparent)", position:"sticky", top:0, zIndex:100 },
  bottomNav: { position:"fixed", bottom:0, left:0, right:0, padding:"10px 10px", background:"var(--clr-surface)", borderTop:"1px solid color-mix(in srgb,var(--clr-accent) 12%,transparent)", display:"flex", alignItems:"stretch", gap:4, zIndex:200 },
  navBtn: (active) => ({
    flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    gap:4, cursor:"pointer", background: active ? "var(--clr-accent-soft)" : "transparent", border:"none",
    borderRadius:8, padding:"8px 4px",
    color: active ? "var(--clr-accent)" : "var(--clr-muted)",
    fontWeight: active ? 600 : 500,
    fontSize:11, letterSpacing:0, transition:"all .18s",
    fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif",
  }),
  inp: { width:"100%", background:"var(--clr-primary)", border:"1px solid color-mix(in srgb,var(--clr-muted) 24%,transparent)", borderRadius:8, padding:"11px 13px", color:"var(--clr-text)", fontSize:14, marginTop:5, marginBottom:13, fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  sel: { width:"100%", background:"var(--clr-primary)", border:"1px solid color-mix(in srgb,var(--clr-muted) 24%,transparent)", borderRadius:8, padding:"11px 13px", color:"var(--clr-text)", fontSize:14, marginTop:5, marginBottom:13, cursor:"pointer", fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  lbl:     { fontSize:11, color:"var(--clr-muted)", fontWeight:700, letterSpacing:0, textTransform:"none" },
  uploadZ: { border:"1.5px dashed color-mix(in srgb,var(--clr-accent) 30%,transparent)", borderRadius:8, padding:"16px", textAlign:"center", cursor:"pointer", color:"var(--clr-muted)", fontSize:13, marginBottom:8, minHeight:54 },
  btnP: { background:"var(--clr-accent)", color:"#ffffff", border:"none", padding:"11px 18px", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13, letterSpacing:0, transition:"all .18s", fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  btnG: { background:"transparent", color:"var(--clr-muted)", border:"1px solid color-mix(in srgb,var(--clr-muted) 33%,transparent)", padding:"10px 15px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13, transition:"all .18s", fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  btnD: { background:"var(--clr-surface-high)", color:"var(--clr-text)", border:"1px solid color-mix(in srgb,var(--clr-muted) 22%,transparent)", padding:"10px 15px", borderRadius:8, cursor:"pointer", fontWeight:600, fontSize:13, transition:"all .18s", fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  dFont:  { fontFamily:"'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif" },
  h1:     { fontSize:24, fontWeight:700, fontFamily:"'DM Sans',sans-serif", marginBottom:2 },
  h2:     { fontSize:17, fontWeight:600, fontFamily:"'DM Sans',sans-serif", marginBottom:12 },
  h3:     { fontSize:11, fontWeight:700, color:"var(--clr-muted)", letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" },
  accent: { color:"var(--clr-accent)" },
  muted:  { color:"var(--clr-muted)", fontSize:13 },
  tab: (a) => ({
    padding:"8px 15px", cursor:"pointer", fontWeight:a?600:400, fontSize:13,
    color: a ? "var(--clr-accent)" : "var(--clr-muted)",
    background: a ? "color-mix(in srgb,var(--clr-accent) 18%,transparent)" : "transparent",
    borderRadius:8, border: a ? "1px solid color-mix(in srgb,var(--clr-accent) 33%,transparent)" : "1px solid transparent",
    transition:"all .2s", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif",
  }),
  chip: (s) => {
    const m = { pending:"#d4a82a", approved:"#4ade80", revision:"#f87171", high:"#f87171", medium:"#d4a82a", low:"#4ade80", vm:"#818cf8", manager:"#4F46E5", super_admin:"#a855f7" };
    return { display:"inline-block", background:(m[s]||"#888")+"22", color:m[s]||"#888", padding:"3px 9px", borderRadius:999, fontSize:11, fontWeight:700, whiteSpace:"nowrap" };
  },
  avatar: (size=32) => ({
    width:size, height:size, borderRadius:"50%", background:"color-mix(in srgb,var(--clr-accent) 33%,transparent)",
    color:"var(--clr-accent)", display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.35, fontWeight:700, flexShrink:0,
  }),
  bubble: (mine) => ({
    alignSelf: mine?"flex-end":"flex-start",
    background: mine ? "var(--clr-accent)" : "var(--clr-surface-high)",
    color: mine ? "#ffffff" : "var(--clr-text)",
    padding:"9px 14px",
    borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    maxWidth:"75%", fontSize:13, lineHeight:1.5,
  }),
  prioBar: (p) => {
    const w  = { high:"100%", medium:"60%", low:"30%" };
    const cl = { high:"#f87171", medium:"#d4a82a", low:"#4ade80" };
    return { height:3, borderRadius:2, width:w[p]||"50%", background:cl[p]||"var(--clr-accent)", marginTop:6 };
  },
};

export const globalCss = (mode = "dark") => {
  const t = mode === "light" ? LIGHT : DARK;
  return `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --clr-primary:      ${t.primaryColor};
  --clr-accent:       ${t.accentColor};
  --clr-accent-soft:  ${t.accentSoft};
  --clr-surface:      ${t.surfaceColor};
  --clr-surface-high: ${t.surfaceHigh};
  --clr-text:         ${t.textColor};
  --clr-muted:        ${t.mutedColor};
}
body { background: var(--clr-primary); color: var(--clr-text); transition: background .3s, color .3s; font-family:'IBM Plex Sans Arabic','DM Sans',system-ui,sans-serif; line-height:1.5; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: color-mix(in srgb,var(--clr-accent) 44%,transparent); border-radius: 3px; }
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
.fu  { animation: fadeUp .4s ease both; }
.fu2 { animation: fadeUp .4s .1s ease both; }
.fu3 { animation: fadeUp .4s .2s ease both; }
@keyframes pageFade { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
.page-transition { animation: pageFade .22s ease both; }
@media (prefers-reduced-motion: reduce) {
  .fu, .fu2, .fu3, .page-transition { animation: none; }
}
.btnP:hover  { filter: brightness(1.1); transform: translateY(-1px); }
.btnG:hover  { opacity: .8; }
.pill-btn:hover { opacity: .8; }
.card-h:hover   { transform: translateY(-2px); }
.tab-btn:hover  { opacity: .8; }
input:focus, textarea:focus, select:focus, button:focus-visible, a:focus-visible { outline: 2px solid var(--clr-accent); outline-offset: 2px; }
input, textarea, select { color-scheme: ${mode === "light" ? "light" : "dark"}; }
button:disabled { opacity:.55; cursor:not-allowed; transform:none !important; }
img { max-width:100%; }
@media (max-width: 640px) {
  body { -webkit-text-size-adjust: 100%; }
  .tab-btn, .btnP, .btnG, .btnD, button { min-height: 42px; }
  table { display:block; width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
}
`;
};
