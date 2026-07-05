import { useRef, useState } from "react";
import { globalCss, S, C } from "../../styles/theme.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import { compressAndPreview, formatBytes } from "../../lib/imageCompression.js";

export function StyleTag() {
  const { mode } = useTheme();
  return <style dangerouslySetInnerHTML={{ __html: globalCss(mode) }} />;
}

export function Avatar({ initials, size = 32 }) {
  return <div style={S.avatar(size)}>{initials}</div>;
}

export function ImageUploader({ label, max = 10, files, onChange }) {
  const ref = useRef();
  const [compressing, setCompressing] = useState(false);
  const [savedKB, setSavedKB] = useState(0);

  const handle = async (e) => {
    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    const chosen = Array.from(e.target.files)
      .filter(f => {
        if (f.size > MAX_SIZE) { alert(`"${f.name}" exceeds 15MB limit and was skipped.`); return false; }
        return true;
      })
      .slice(0, max - files.length);
    if (!chosen.length) { e.target.value = ""; return; }
    setCompressing(true);
    try {
      const compressed = await compressAndPreview(chosen, "beforeAfter");
      const saved = compressed.reduce((a, f) => a + (f.originalSize - f.compressedSize), 0);
      setSavedKB(Math.round(saved / 1024));
      onChange([...files, ...compressed]);
    } finally { setCompressing(false); }
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={S.lbl}>{label} ({files.length}/{max})</div>
        {savedKB > 0 && <div style={{ fontSize:10, color:"#4ade80" }}>↓ {savedKB}KB saved</div>}
      </div>
      <div style={{ ...S.uploadZ, opacity: compressing ? .6 : 1 }}
        onClick={() => !compressing && ref.current.click()}>
        {compressing ? "⏳ Compressing…" : files.length === 0
          ? `＋ Tap to upload (max ${max})`
          : `${files.length} photo(s) · tap to add`}
        <input ref={ref} type="file" accept="image/*" multiple
          style={{ display:"none" }} onChange={handle} />
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        {files.map((f, i) => (
          <div key={i} style={{ position:"relative" }}>
            <img loading="lazy" src={f.url} alt="" style={{
              width:66, height:66, objectFit:"cover", borderRadius:8,
              border:"1px solid color-mix(in srgb,var(--clr-accent) 22%,transparent)",
            }} />
            {f.compressedSize && (
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                background:"#000a", fontSize:8, color:"#fff",
                textAlign:"center", borderRadius:"0 0 8px 8px", padding:"1px 0" }}>
                {formatBytes(f.compressedSize)}
              </div>
            )}
            <button onClick={() => onChange(files.filter((_, j) => j !== i))}
              style={{ position:"absolute", top:-5, right:-5,
                background:"var(--clr-accent)", color:"var(--clr-primary)",
                border:"none", borderRadius:"50%", width:17, height:17,
                cursor:"pointer", fontSize:9, fontWeight:900, lineHeight:"17px", padding:0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}