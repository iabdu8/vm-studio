import { useState, useEffect } from "react";
import { C } from "../../styles/theme.js";

// In-app file preview modal — PDFs render natively in every browser (no
// external viewer round-trip, which was the slow path before), PPT/PPTX
// go through Office Online since browsers can't render those at all,
// everything else is treated as an image. A spinner + "taking a while?"
// hint covers the wait instead of leaving a blank screen.
export function FilePreview({ url, title, fileType, onClose }) {
  const [loaded,  setLoaded]  = useState(false);
  const [slow,    setSlow]    = useState(false);

  const clean = (url ?? "").split("?")[0].toLowerCase();
  const isPDF = fileType === "pdf" || clean.endsWith(".pdf");
  const isPPT = fileType === "ppt" || /\.pptx?$/.test(clean);
  const isFramed = isPDF || isPPT;

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    if (!isFramed) return;
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [url, isFramed]);

  if (!url) return null;

  const pdfSrc    = `${url}#toolbar=1`;
  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000000cc", zIndex:700,
      display:"flex", flexDirection:"column",
    }}>
      <div style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 20px", background:"var(--clr-surface)",
        borderBottom:`1px solid ${C.accentColor}22`,
        flexShrink:0,
      }}>
        <div style={{ fontWeight:700, fontSize:14, flex:1, marginRight:12,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <a href={url} download target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:"none", fontSize:12, padding:"6px 14px",
              background:C.accentColor+"22", color:C.accentColor,
              border:`1px solid ${C.accentColor}44`, borderRadius:8, cursor:"pointer" }}>
            ⬇️ Download
          </a>
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:"none", fontSize:12, padding:"6px 14px",
              background:"transparent", color:C.mutedColor,
              border:`1px solid ${C.mutedColor}33`, borderRadius:8, cursor:"pointer" }}>
            ↗ New Tab
          </a>
          <button onClick={onClose} style={{ background:"none", border:"none",
            color:C.mutedColor, cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
        </div>
      </div>

      {isFramed && slow && !loaded && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          padding:"8px 16px", background:"#d4a82a18", borderBottom:"1px solid #d4a82a33",
          fontSize:12, color:"#d4a82a", flexShrink:0 }}>
          🐢 Taking longer than usual —
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color:"#d4a82a", fontWeight:700 }}>
            open in a new tab instead →
          </a>
        </div>
      )}

      <div style={{ flex:1, overflow:"hidden", display:"flex",
        alignItems:"center", justifyContent:"center", background:"#111", position:"relative" }}>
        {isFramed && !loaded && (
          <div style={{ position:"absolute", color:"#fff", fontSize:13, display:"flex",
            flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:"50%",
              border:`3px solid ${C.accentColor}33`, borderTopColor:C.accentColor,
              animation:"spin .8s linear infinite" }}/>
            Loading…
          </div>
        )}
        {isPDF ? (
          <iframe src={pdfSrc} onLoad={() => setLoaded(true)}
            style={{ width:"100%", height:"100%", border:"none", opacity: loaded ? 1 : 0 }} title={title}/>
        ) : isPPT ? (
          <iframe src={officeSrc} onLoad={() => setLoaded(true)}
            style={{ width:"100%", height:"100%", border:"none", opacity: loaded ? 1 : 0 }} title={title}/>
        ) : (
          <img loading="lazy" src={url} alt={title}
            style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
