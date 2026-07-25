import { useRef, useState } from "react";
import { S } from "../../styles/theme.js";
import { GuidelinesGrid } from "../shared/Guidelines.jsx";
import { CampaignPanel } from "./CampaignPanel.jsx";

export function CampaignGuidesPage({ company, guidelines, onUploadGuideline, onDeleteGuideline,
  campaign, onSaveCampaign, campaignProgress, onSetBranchStatus, campaignAck, onAcknowledgeCampaign }) {
  const [gTitle,  setGTitle]  = useState("");
  const [gCat,    setGCat]    = useState("General");
  const [gFile,   setGFile]   = useState(null);
  const [saving,  setSaving]  = useState(false);
  const gFileRef = useRef();

  const uploadGuide = async () => {
    if (!gTitle.trim()) return;
    setSaving(true);
    try { await onUploadGuideline(gTitle, gCat, gFile); setGTitle(""); setGFile(null); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ ...S.h1, marginBottom:2 }} className="fu">
        Campaign <span style={S.accent}>&amp; Guides</span>
      </div>
      <div style={{ ...S.muted, marginBottom:16, fontSize:12 }}>
        Sign off on the active campaign · publish team guidelines
      </div>

      <CampaignPanel campaign={campaign} onSaveCampaign={onSaveCampaign} campaignProgress={campaignProgress}
        onSetBranchStatus={onSetBranchStatus} campaignAck={campaignAck} onAcknowledgeCampaign={onAcknowledgeCampaign} />

      <div style={{ ...S.h3, marginTop:20, marginBottom:10 }}>Guidelines</div>
      <div style={S.card}>
        <div style={S.h3}>Upload New Guideline</div>
        <div style={S.lbl}>Title</div>
        <input style={S.inp} placeholder="Guideline title"
          value={gTitle} onChange={e => setGTitle(e.target.value)}/>
        <div style={S.lbl}>Category</div>
        <select style={S.sel} value={gCat} onChange={e => setGCat(e.target.value)}>
          {["General","Brand","Display","Seasonal"].map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={S.lbl}>File (PDF or Image)</div>
        <div style={{ ...S.uploadZ, marginBottom:12 }} onClick={() => gFileRef.current.click()}>
          {gFile ? `✓ ${gFile.name}` : "＋ Tap to select file"}
          <input ref={gFileRef} type="file" accept=".pdf,image/*"
            style={{ display:"none" }} onChange={e => setGFile(e.target.files[0] ?? null)}/>
        </div>
        <button className="btnP" style={{ ...S.btnP, width:"100%" }}
          onClick={uploadGuide} disabled={saving}>
          {saving ? "Uploading…" : "Publish to Team →"}
        </button>
      </div>
      <div style={{ ...S.h3, marginTop:4, marginBottom:10 }}>Published ({guidelines.length})</div>
      <GuidelinesGrid guidelines={guidelines} showAcks={true} companyId={company?.id} onDelete={onDeleteGuideline}/>
    </div>
  );
}
