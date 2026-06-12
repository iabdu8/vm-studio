export const DARK = {
  primaryColor: "#0a0a0f",
  accentColor:  "#c8a96e",
  accentSoft:   "#c8a96e18",
  surfaceColor: "#13131a",
  surfaceHigh:  "#1c1c27",
  textColor:    "#f0ede8",
  mutedColor:   "#6b6880",
};

export const LIGHT = {
  primaryColor: "#f5f4f0",
  accentColor:  "#8a6d3e",
  accentSoft:   "#8a6d3e18",
  surfaceColor: "#ffffff",
  surfaceHigh:  "#ece9e3",
  textColor:    "#1a1a2e",
  mutedColor:   "#8892a4",
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
  app:  { minHeight:"100vh", background:"var(--clr-primary)", color:"var(--clr-text)", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", paddingBottom:70 },
  main: { flex:1, padding:"18px 16px", maxWidth:900, margin:"0 auto", width:"100%" },
  card: { background:"var(--clr-surface)", border:"1px solid color-mix(in srgb,var(--clr-accent) 12%,transparent)", borderRadius:16, padding:"18px 20px", marginBottom:14 },
  loginBg:   { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--clr-primary)" },
  loginCard: { background:"var(--clr-surface)", borderRadius:24, padding:"50px 42px", width:390, border:"1px solid color-mix(in srgb,var(--clr-accent) 28%,transparent)", boxShadow:"0 32px 80px #00000066" },
  topBar:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:"var(--clr-surface)", borderBottom:"1px solid color-mix(in srgb,var(--clr-accent) 12%,transparent)", position:"sticky", top:0, zIndex:100 },
  bottomNav: { position:"fixed", bottom:0, left:0, right:0, height:66, background:"var(--clr-surface)", borderTop:"1px solid color-mix(in srgb,var(--clr-accent) 18%,transparent)", display:"flex", alignItems:"stretch", zIndex:200 },
  navBtn: (active) => ({
    flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    gap:2, cursor:"pointer", background:"none", border:"none",
    borderTopColor: active ? "var(--clr-accent)" : "transparent",
    borderTopWidth:2, borderTopStyle:"solid",
    color: active ? "var(--clr-accent)" : "var(--clr-muted)",
    fontWeight: active ? 600 : 400,
    fontSize:10, letterSpacing:.5, textTransform:"uppercase", transition:"all .18s",
    fontFamily:"'DM Sans',sans-serif",
  }),
  inp: { width:"100%", background:"var(--clr-primary)", border:"1px solid color-mix(in srgb,var(--clr-accent) 18%,transparent)", borderRadius:10, padding:"10px 14px", color:"var(--clr-text)", fontSize:14, marginTop:5, marginBottom:13, fontFamily:"'DM Sans',sans-serif" },
  sel: { width:"100%", background:"var(--clr-primary)", border:"1px solid color-mix(in srgb,var(--clr-accent) 18%,transparent)", borderRadius:10, padding:"10px 14px", color:"var(--clr-text)", fontSize:14, marginTop:5, marginBottom:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  lbl:     { fontSize:11, color:"var(--clr-muted)", fontWeight:600, letterSpacing:1, textTransform:"uppercase" },
  uploadZ: { border:"2px dashed color-mix(in srgb,var(--clr-accent) 28%,transparent)", borderRadius:12, padding:"16px", textAlign:"center", cursor:"pointer", color:"var(--clr-muted)", fontSize:13, marginBottom:8 },
  btnP: { background:"var(--clr-accent)", color:"var(--clr-primary)", border:"none", padding:"10px 20px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13, letterSpacing:.3, transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  btnG: { background:"transparent", color:"var(--clr-muted)", border:"1px solid color-mix(in srgb,var(--clr-muted) 33%,transparent)", padding:"9px 16px", borderRadius:10, cursor:"pointer", fontWeight:500, fontSize:13, transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  btnD: { background:"var(--clr-surface-high)", color:"var(--clr-text)", border:"1px solid color-mix(in srgb,var(--clr-accent) 18%,transparent)", padding:"9px 16px", borderRadius:10, cursor:"pointer", fontWeight:500, fontSize:13, transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  dFont:  { fontFamily:"'Cormorant Garamond',serif" },
  h1:     { fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", marginBottom:2 },
  h2:     { fontSize:17, fontWeight:600, fontFamily:"'Cormorant Garamond',serif", marginBottom:12 },
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
    const m = { pending:"#d4a82a", approved:"#4ade80", revision:"#f87171", high:"#f87171", medium:"#d4a82a", low:"#4ade80", vm:"#818cf8", manager:"#c8a96e", super_admin:"#a855f7" };
    return { display:"inline-block", background:(m[s]||"#888")+"22", color:m[s]||"#888", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 };
  },
  avatar: (size=32) => ({
    width:size, height:size, borderRadius:"50%", background:"color-mix(in srgb,var(--clr-accent) 33%,transparent)",
    color:"var(--clr-accent)", display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.35, fontWeight:700, flexShrink:0,
  }),
  bubble: (mine) => ({
    alignSelf: mine?"flex-end":"flex-start",
    background: mine ? "var(--clr-accent)" : "var(--clr-surface-high)",
    color: mine ? "var(--clr-primary)" : "var(--clr-text)",
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
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
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
body { background: var(--clr-primary); color: var(--clr-text); transition: background .3s, color .3s; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: color-mix(in srgb,var(--clr-accent) 44%,transparent); border-radius: 3px; }
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
.fu  { animation: fadeUp .4s ease both; }
.fu2 { animation: fadeUp .4s .1s ease both; }
.fu3 { animation: fadeUp .4s .2s ease both; }
.btnP:hover  { filter: brightness(1.1); transform: translateY(-1px); }
.btnG:hover  { opacity: .8; }
.pill-btn:hover { opacity: .8; }
.card-h:hover   { transform: translateY(-2px); }
.tab-btn:hover  { opacity: .8; }
input:focus, textarea:focus, select:focus { outline: none; }
input, textarea, select { color-scheme: ${mode === "light" ? "light" : "dark"}; }
`;
};