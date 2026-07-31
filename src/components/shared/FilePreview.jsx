import { C } from "../../styles/theme.js";

// In-app file preview modal — PDF (native on desktop, Google Docs viewer on
// mobile), PPT/PPTX (Office Online viewer), else treated as an image.
export function FilePreview({ url, title, fileType, onClose }) {
  if (!url) return null;
  const clean = url.split("?")[0].toLowerCase();
  const isPDF = fileType === "pdf" || clean.endsWith(".pdf");
  const isPPT = fileType === "ppt" || /\.pptx?$/.test(clean);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const pdfSrc = isMobile
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : `${url}#toolbar=1`;
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

      <div style={{ flex:1, overflow:"hidden", display:"flex",
        alignItems:"center", justifyContent:"center", background:"#111" }}>
        {isPDF ? (
          <iframe src={pdfSrc} style={{ width:"100%", height:"100%", border:"none" }} title={title}/>
        ) : isPPT ? (
          <iframe src={officeSrc} style={{ width:"100%", height:"100%", border:"none" }} title={title}/>
        ) : (
          <img loading="lazy" src={url} alt={title}
            style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }}/>
        )}
      </div>
    </div>
  );
}
