import { useEffect } from "react";
import { C } from "../../styles/theme.js";

const navBtnStyle = {
  background:"#00000066", border:"none", color:"#fff", width:44, height:44, borderRadius:"50%",
  fontSize:26, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
};

// Full-screen photo viewer with prev/next navigation. Pass `selectable` +
// `flaggedIds` + `onToggleFlag` to let a reviewer flag specific photos
// for revision instead of the whole submission.
export function PhotoLightbox({ photos, index, onClose, onIndexChange,
  selectable = false, flaggedIds = [], onToggleFlag }) {
  const photo = photos?.[index];

  useEffect(() => {
    if (photo == null) return;
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, index, photos, onClose, onIndexChange]);

  if (photo == null) return null;
  const isFlagged = flaggedIds.includes(photo.id);

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000e8", zIndex:800,
      display:"flex", flexDirection:"column" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px" }}>
        <div style={{ color:"#fff", fontSize:13, fontWeight:600 }}>
          {index + 1} / {photos.length}{photo.label ? ` · ${photo.label}` : ""}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:26, cursor:"pointer", lineHeight:1 }}>✕</button>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"0 14px", minHeight:0 }}>
        {photos.length > 1
          ? <button style={navBtnStyle} onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}>‹</button>
          : <div style={{ width:44 }} />}
        <img loading="lazy" src={photo.url} alt="" style={{
          maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:8,
          border: isFlagged ? "3px solid #f87171" : "none",
        }}/>
        {photos.length > 1
          ? <button style={navBtnStyle} onClick={() => onIndexChange((index + 1) % photos.length)}>›</button>
          : <div style={{ width:44 }} />}
      </div>

      {(photo.comment || selectable) && (
        <div style={{ padding:"14px 20px", background:"#111", display:"flex",
          flexDirection:"column", gap:10 }}>
          {photo.comment && <div style={{ color:"#ddd", fontSize:13 }}>💬 {photo.comment}</div>}
          {selectable && (
            <button onClick={() => onToggleFlag(photo.id)} style={{
              padding:"9px 16px", borderRadius:8, border:"none", cursor:"pointer",
              fontWeight:700, fontSize:13, alignSelf:"flex-start",
              background: isFlagged ? "#f87171" : C.surfaceHigh,
              color: isFlagged ? "#fff" : C.mutedColor,
            }}>
              {isFlagged ? "✕ Unflag Photo" : "🚩 Flag This Photo for Revision"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
