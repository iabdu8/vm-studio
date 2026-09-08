import { useRef, useState } from "react";
import { S } from "../../styles/theme.js";
import { GuidelinesGrid } from "./Guidelines.jsx";
import { t } from "../../lib/i18n.js";

const GUIDELINE_CATEGORIES = [
  ["General", "guidelines.categoryGeneral"],
  ["Brand", "guidelines.categoryBrand"],
  ["Display", "guidelines.categoryDisplay"],
  ["Seasonal", "guidelines.categorySeasonal"],
];

// Upload form + managed grid — used by any role allowed to publish guidelines
export function GuidelinesManager({ company, guidelines, onUploadGuideline, onDeleteGuideline }) {
  const [gTitle, setGTitle] = useState("");
  const [gCat,   setGCat]   = useState("General");
  const [gFile,  setGFile]  = useState(null);
  const [saving, setSaving] = useState(false);
  const gFileRef = useRef();

  const uploadGuide = async () => {
    if (!gTitle.trim()) return;
    setSaving(true);
    try { await onUploadGuideline(gTitle, gCat, gFile); setGTitle(""); setGFile(null); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.h3}>{t("guidelines.uploadNew", "Upload New Guideline")}</div>
        <div style={S.lbl}>{t("guidelines.title", "Title")}</div>
        <input style={S.inp} placeholder={t("guidelines.titlePlaceholder", "Guideline title")}
          value={gTitle} onChange={e => setGTitle(e.target.value)}/>
        <div style={S.lbl}>{t("guidelines.category", "Category")}</div>
        <select style={S.sel} value={gCat} onChange={e => setGCat(e.target.value)}>
          {GUIDELINE_CATEGORIES.map(([value, labelKey]) => <option key={value} value={value}>{t(labelKey, value)}</option>)}
        </select>
        <div style={S.lbl}>{t("guidelines.file", "File (PDF or Image)")}</div>
        <div style={{ ...S.uploadZ, marginBottom:12 }} onClick={() => gFileRef.current.click()}>
          {gFile ? `✓ ${gFile.name}` : `＋ ${t("guidelines.selectFile", "Tap to select file")}`}
          <input ref={gFileRef} type="file" accept=".pdf,image/*"
            style={{ display:"none" }} onChange={e => setGFile(e.target.files[0] ?? null)}/>
        </div>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }}
          onClick={uploadGuide} disabled={saving}>
          {saving ? t("guidelines.uploading", "Uploading...") : `${t("guidelines.publish", "Publish to Team")} →`}
        </button>
      </div>
      <div style={{ ...S.h3, marginTop:4, marginBottom:10 }}>{t("guidelines.published", "Published")} ({guidelines.length})</div>
      <GuidelinesGrid guidelines={guidelines} showAcks={true} companyId={company?.id} onDelete={onDeleteGuideline}/>
    </div>
  );
}
