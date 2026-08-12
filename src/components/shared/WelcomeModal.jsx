import { S, C } from "../../styles/theme.js";

const ROLE_BLURB = {
  manager:       "You're logged in as Head VM — the company-wide view. You see every branch, set campaigns and Best Branch of the Month, and can comment on anything anywhere.",
  area_manager:  "You're logged in as VM Manager — scoped to the branches assigned to you. You can view and comment, but approvals and edits stay with the VM Controller.",
  store_manager: "You're logged in as VM Controller — you run one branch. You schedule the weekly plan, approve submitted work, and everything you add shows up for your VMs instantly.",
  vm:            "You're logged in as VM — you execute the tasks your Controller schedules. Tap a task in your Plan, upload before/after photos, and it goes straight to your Controller for approval.",
};

export function WelcomeModal({ role, onClose }) {
  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"#00000077", zIndex:998 }}/>
      <div style={{
        position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        zIndex:999, width:"min(400px, 92vw)", background:"var(--clr-surface)",
        borderRadius:18, padding:26, border:`1px solid ${C.accentColor}33`,
        boxShadow:"0 20px 60px #00000055",
      }}>
        <div style={{ fontSize:32, marginBottom:10 }}>👋</div>
        <div style={{ ...S.h2, marginBottom:8 }}>Welcome to Vismo</div>
        <div style={{ fontSize:13, lineHeight:1.6, color:C.mutedColor, marginBottom:14 }}>
          This is a live product demo — every screen is fully working, not a mockup.
          Look for the <strong style={{ color:C.textColor }}>💡 tip</strong> at the top of each page
          explaining what that feature does and when it kicks in.
        </div>
        {ROLE_BLURB[role] && (
          <div style={{ fontSize:13, lineHeight:1.6, padding:"10px 12px", borderRadius:10,
            background:C.accentColor+"12", border:`1px solid ${C.accentColor}28`, marginBottom:18 }}>
            {ROLE_BLURB[role]}
          </div>
        )}
        <button className="btnP" style={{ ...S.btnP, width:"100%" }} onClick={onClose}>
          Got it, let's explore →
        </button>
      </div>
    </>
  );
}
