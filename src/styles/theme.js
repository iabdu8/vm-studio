// ============================================================
//  THEME — Default colors (overridden by company settings)
//  No brand.js dependency in SaaS version
// ============================================================

export const C = {
  appName:      "VM-Studio",
  primaryColor: "#0a0a0f",
  accentColor:  "#c8a96e",
  accentSoft:   "#c8a96e18",
  surfaceColor: "#13131a",
  surfaceHigh:  "#1c1c27",
  textColor:    "#f0ede8",
  mutedColor:   "#6b6880",
};

export const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${C.primaryColor}; -webkit-tap-highlight-color: transparent; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: ${C.accentColor}44; border-radius: 3px; }
@keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
.fu  { animation: fadeUp .4s ease both; }
.fu2 { animation: fadeUp .4s .1s ease both; }
.fu3 { animation: fadeUp .4s .2s ease both; }
.btnP:hover  { filter: brightness(1.1); transform: translateY(-1px); }
.btnG:hover  { border-color: ${C.accentColor}66 !important; color: ${C.accentColor} !important; }
.pill-btn:hover { background: ${C.accentColor}22 !important; border-color: ${C.accentColor}44 !important; }
.card-h:hover   { border-color: ${C.accentColor}33 !important; transform: translateY(-2px); }
.tab-btn:hover  { color: ${C.accentColor} !important; }
input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.accentColor}55 !important; }
`;

export const S = {
  app:  { minHeight:"100vh", background:C.primaryColor, color:C.textColor, fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", paddingBottom:70 },
  main: { flex:1, padding:"18px 16px", maxWidth:900, margin:"0 auto", width:"100%" },
  card: { background:C.surfaceColor, border:`1px solid ${C.accentColor}12`, borderRadius:16, padding:"18px 20px", marginBottom:14, transition:"border-color .2s, transform .2s" },
  loginBg:   { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
    backgroundImage:`radial-gradient(ellipse at 65% 15%,${C.accentColor}14,transparent 55%),radial-gradient(ellipse at 10% 85%,${C.surfaceColor},transparent 50%)` },
  loginCard: { background:C.surfaceColor, borderRadius:24, padding:"50px 42px", width:390,
    border:`1px solid ${C.accentColor}28`, boxShadow:`0 32px 80px #00000066` },
  topBar:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px",
    background:C.surfaceColor, borderBottom:`1px solid ${C.accentColor}12`, position:"sticky", top:0, zIndex:100 },
  bottomNav: { position:"fixed", bottom:0, left:0, right:0, height:66, background:C.surfaceColor,
    borderTop:`1px solid ${C.accentColor}18`, display:"flex", alignItems:"stretch", zIndex:200 },
  navBtn: (active) => ({
    flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
    gap:2, cursor:"pointer", background:"none", border:"none",
    borderTopColor: active ? C.accentColor : "transparent",
    borderTopWidth:2, borderTopStyle:"solid",
    color:      active ? C.accentColor : C.mutedColor,
    fontWeight: active ? 600 : 400,
    fontSize:10, letterSpacing:.5, textTransform:"uppercase", transition:"all .18s",
    fontFamily:"'DM Sans',sans-serif",
  }),
  inp: { width:"100%", background:C.primaryColor, border:`1px solid ${C.accentColor}1a`, borderRadius:10,
    padding:"10px 14px", color:C.textColor, fontSize:14, marginTop:5, marginBottom:13,
    fontFamily:"'DM Sans',sans-serif", transition:"border-color .2s" },
  sel: { width:"100%", background:C.primaryColor, border:`1px solid ${C.accentColor}1a`, borderRadius:10,
    padding:"10px 14px", color:C.textColor, fontSize:14, marginTop:5, marginBottom:13,
    cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  lbl:     { fontSize:11, color:C.mutedColor, fontWeight:600, letterSpacing:1, textTransform:"uppercase" },
  uploadZ: { border:`2px dashed ${C.accentColor}2a`, borderRadius:12, padding:"16px",
    textAlign:"center", cursor:"pointer", color:C.mutedColor, fontSize:13, marginBottom:8 },
  btnP: { background:C.accentColor, color:"#0a0a0f", border:"none", padding:"10px 20px",
    borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13, letterSpacing:.3,
    transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  btnG: { background:"transparent", color:C.mutedColor, border:`1px solid ${C.mutedColor}33`,
    padding:"9px 16px", borderRadius:10, cursor:"pointer", fontWeight:500, fontSize:13,
    transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  btnD: { background:"#1c1c27", color:C.textColor, border:`1px solid ${C.accentColor}18`,
    padding:"9px 16px", borderRadius:10, cursor:"pointer", fontWeight:500, fontSize:13,
    transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  dFont:  { fontFamily:"'Cormorant Garamond',serif" },
  h1:     { fontSize:24, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", marginBottom:2 },
  h2:     { fontSize:17, fontWeight:600, fontFamily:"'Cormorant Garamond',serif", marginBottom:12 },
  h3:     { fontSize:11, fontWeight:700, color:C.mutedColor, letterSpacing:1.5, marginBottom:10, textTransform:"uppercase" },
  accent: { color:C.accentColor },
  muted:  { color:C.mutedColor, fontSize:13 },
  tab: (a) => ({
    padding:"8px 15px", cursor:"pointer", fontWeight:a?600:400, fontSize:13,
    color: a ? C.accentColor : C.mutedColor,
    background: a ? C.accentColor+"18" : "transparent",
    borderRadius:8, border: a ? `1px solid ${C.accentColor}33` : "1px solid transparent",
    transition:"all .2s", whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif",
  }),
  chip: (s) => {
    const m = { pending:"#d4a82a", approved:"#4ade80", revision:"#f87171",
                high:"#f87171", medium:"#d4a82a", low:"#4ade80",
                vm:"#818cf8", manager:"#c8a96e", super_admin:"#a855f7" };
    return { display:"inline-block", background:(m[s]||"#888")+"22",
             color:m[s]||"#888", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 };
  },
  avatar: (size=32) => ({
    width:size, height:size, borderRadius:"50%", background:C.accentColor+"33",
    color:C.accentColor, display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.35, fontWeight:700, flexShrink:0,
  }),
  bubble: (mine) => ({
    alignSelf: mine?"flex-end":"flex-start",
    background: mine ? C.accentColor : C.surfaceHigh,
    color: mine ? "#0a0a0f" : C.textColor,
    padding:"9px 14px",
    borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    maxWidth:"75%", fontSize:13, lineHeight:1.5,
  }),
  prioBar: (p) => {
    const w  = { high:"100%", medium:"60%", low:"30%" };
    const cl = { high:"#f87171", medium:"#d4a82a", low:"#4ade80" };
    return { height:3, borderRadius:2, width:w[p]||"50%", background:cl[p]||C.accentColor, marginTop:6 };
  },
};
