import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase.js";

const C = {
  bg:"#0A0A12", surface:"#0F0F1E", card:"#14142A", border:"#1E1E3A",
  indigo:"#4F46E5", indigoL:"#818CF8", cyan:"#06B6D4",
  text:"#F8FAFC", muted:"#94A3B8", green:"#10B981",
};

function Tag({ children }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6,
      background:`${C.indigo}18`, color:C.indigoL,
      border:`1px solid ${C.indigo}44`, padding:"4px 14px", borderRadius:100,
      fontSize:12, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>
      {children}
    </span>
  );
}

function DashMockup() {
  return (
    <div style={{ borderRadius:20, overflow:"hidden", border:`1px solid ${C.border}`,
      background:C.card, boxShadow:`0 40px 120px #00000088`, maxWidth:860, margin:"0 auto" }}>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#EF4444" }}/>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#F59E0B" }}/>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#10B981" }}/>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6,
            background:`${C.border}88`, padding:"4px 16px", borderRadius:8, fontSize:12, color:C.muted }}>
            🔒 vismo1.com
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"row", overflowX:"hidden", minHeight:300, maxHeight:420 }}>
        <div style={{ width:180, borderRight:`1px solid ${C.border}`, padding:14,
          display:"flex", flexDirection:"column", gap:4 }}>
          {[["📊","Overview",true],["✅","Tasks",false],["🚶","Visits",false],
            ["📖","Guidelines",false],["💬","Chat",false],["🎓","Training",false]].map(([icon,label,active]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 10px",
              borderRadius:8, background:active?`${C.indigo}22`:"transparent",
              color:active?C.indigoL:C.muted, fontSize:12, fontWeight:active?600:400 }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>
        <div style={{ flex:1, padding:18, overflowY:"hidden" }}>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Operations Overview</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10, marginBottom:16 }}>
            {[["128","Total Tasks"],["96","Completed"],["24","In Progress"],["8","Overdue"]].map(([n,l]) => (
              <div key={l} style={{ background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4, textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:800, color:l==="Overdue"?"#F87171":C.text }}>{n}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Recent Tasks</div>
              {[["Window Display","Salam Mall","done"],["New Promo","Jeddah Park","progress"],["Shelf Org","Red Sea Mall","pending"]].map(([t,b,s]) => (
                <div key={t} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600 }}>{t}</div>
                    <div style={{ fontSize:10, color:C.muted }}>{b}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20,
                    background:s==="done"?"#10B98122":s==="progress"?`${C.indigo}22`:"#F59E0B22",
                    color:s==="done"?"#10B981":s==="progress"?C.indigoL:"#F59E0B" }}>
                    {s==="done"?"Done":s==="progress"?"In Progress":"Pending"}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>Branch Progress</div>
              {[["Salam Mall",85],["Jeddah Park",62],["Mall of Arabia",40],["Red Sea Mall",91]].map(([b,p]) => (
                <div key={b} style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                    <span>{b}</span><span style={{ color:C.indigoL, fontWeight:700 }}>{p}%</span>
                  </div>
                  <div style={{ height:3, background:C.border, borderRadius:2 }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${p}%`,
                      background:`linear-gradient(90deg,${C.indigo},${C.cyan})` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, marginBottom:4, background:C.card, overflow:"hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", textAlign:"left", padding:"18px 22px",
        background:"transparent", border:"none", color:C.text, fontSize:14, fontWeight:600,
        cursor:"pointer", fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        {q}
        <span style={{ color:C.indigoL, fontSize:18, transition:"transform .2s",
          transform:open?"rotate(45deg)":"none" }}>+</span>
      </button>
      {open && <div style={{ padding:"0 22px 18px", fontSize:13, color:C.muted, lineHeight:1.8 }}>{a}</div>}
    </div>
  );
}

function DemoModal({ onClose }) {
  const [form, setForm] = useState({ name:"", company:"", email:"", phone:"", team_size:"" });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      setErr("Please fill in name, company, and email."); return;
    }
    setLoading(true); setErr("");
    try {
      // Send to Formspree (email notification) + Supabase (record keeping)
      const res = await fetch("https://formspree.io/f/xkolykny", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name:      form.name.trim(),
          company:   form.company.trim(),
          email:     form.email.trim(),
          phone:     form.phone.trim() || "—",
          team_size: form.team_size || "—",
        }),
      });
      if (!res.ok) throw new Error("Failed");

      // Also save to Supabase
      try {
        await supabase.from("demo_requests").insert({
          full_name:    form.name.trim(),
          company:      form.company.trim(),
          email:        form.email.trim(),
          phone:        form.phone.trim() || null,
          team_size:    form.team_size || null,
          requested_at: new Date().toISOString(),
        });
      } catch (_) {}

      setSent(true);
    } catch (e) {
      setErr("Something went wrong. Please try again or email us at info@vismo1.com");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000099", zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.surface, borderRadius:20, padding:36, maxWidth:460, width:"100%",
        border:`1px solid ${C.border}`, boxShadow:`0 40px 80px #00000088` }}>
        {sent ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🎉</div>
            <div style={{ fontSize:22, fontWeight:700, marginBottom:8, color:C.text }}>Request Received!</div>
            <div style={{ fontSize:14, color:C.muted, lineHeight:1.7, marginBottom:24 }}>
              We'll reach out within 24 hours to schedule your personalized demo.
            </div>
            <button onClick={onClose} style={{ background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff", padding:"12px 28px", borderRadius:10,
              fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={{ fontSize:20, fontWeight:800, color:C.text }}>Request a Demo</div>
              <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted,
                cursor:"pointer", fontSize:22, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:24 }}>
              Fill in your details and we'll set up a personalized walkthrough for your team.
            </div>

            {[["Full Name *","name","text","e.g. Abdullah Ahmed"],
              ["Company Name *","company","text","e.g. Home Centre"],
              ["Work Email *","email","email","you@company.com"],
              ["Phone (optional)","phone","tel","+966 5x xxx xxxx"],
            ].map(([label,field,type,placeholder]) => (
              <div key={field} style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:1,
                  textTransform:"uppercase", marginBottom:5 }}>{label}</div>
                <input type={type} placeholder={placeholder}
                  value={form[field]}
                  onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`,
                    borderRadius:10, padding:"10px 14px", color:C.text, fontSize:14,
                    fontFamily:"inherit", boxSizing:"border-box" }}/>
              </div>
            ))}

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:600, color:C.muted, letterSpacing:1,
                textTransform:"uppercase", marginBottom:5 }}>Team Size</div>
              <select value={form.team_size} onChange={e => setForm(p => ({ ...p, team_size: e.target.value }))}
                style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`,
                  borderRadius:10, padding:"10px 14px", color:form.team_size?C.text:C.muted,
                  fontSize:14, fontFamily:"inherit" }}>
                <option value="">Select team size</option>
                <option>1–5 VM staff</option>
                <option>6–20 VM staff</option>
                <option>21–50 VM staff</option>
                <option>50+ VM staff</option>
              </select>
            </div>

            {err && <div style={{ color:"#f87171", fontSize:13, marginBottom:12 }}>{err}</div>}

            <button onClick={submit} disabled={loading} style={{
              width:"100%", background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff", padding:"14px", borderRadius:10,
              fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 0 24px ${C.indigo}44`,
            }}>
              {loading ? "Sending…" : "Request Demo →"}
            </button>

          </>
        )}
      </div>
    </div>
  );
}

export function LandingPage({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const openDemo = () => setShowDemo(true);

  return (
    <div style={{ background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif",
      minHeight:"100vh", overflowX:"hidden" }}>

      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100,
        padding:"0 32px",
        background:scrolled?`${C.surface}ee`:"transparent",
        backdropFilter:scrolled?"blur(12px)":"none",
        borderBottom:scrolled?`1px solid ${C.border}`:"none",
        transition:"all .3s" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", height:64,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <img src="/logo-dark.webp" alt="Vismo" style={{ height:34, objectFit:"contain" }}
            onError={e => { e.target.style.display="none"; }}/>
          <div className="nav-links" style={{ display:"flex", gap:24, alignItems:"center" }}>
            {[["Features","#features"],["How it works","#how"],["Pricing","#pricing"],["FAQ","#faq"]].map(([l,h]) => (
              <a key={l} href={h} style={{ color:C.muted, fontSize:14, fontWeight:500,
                textDecoration:"none", whiteSpace:"nowrap" }}>{l}</a>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onEnterApp} style={{ background:"transparent", border:`1px solid ${C.border}`,
              color:C.text, padding:"8px 20px", borderRadius:10, cursor:"pointer",
              fontSize:14, fontWeight:600, fontFamily:"inherit" }}>Sign In</button>
            <button onClick={openDemo} style={{ background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff", padding:"8px 20px", borderRadius:10, cursor:"pointer",
              fontSize:14, fontWeight:700, fontFamily:"inherit",
              boxShadow:`0 0 20px ${C.indigo}44` }}>Request Demo</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ paddingTop:"clamp(100px,15vw,160px)", paddingBottom:"clamp(40px,8vw,80px)", textAlign:"center",
        background:`radial-gradient(ellipse 900px 600px at 50% 0%, ${C.indigo}18, transparent)` }}>
        <div style={{ maxWidth:860, margin:"0 auto", padding:"0 24px" }}>
          <Tag>Built for Visual Merchandisers 🛍️</Tag>
          <h1 style={{ fontSize:"clamp(40px,6vw,72px)", fontWeight:800, lineHeight:1.1,
            margin:"24px 0 20px", letterSpacing:-1.5 }}>
            One Platform.<br/>
            <span style={{ background:`linear-gradient(135deg,${C.cyan},${C.indigoL})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Zero Confusion.
            </span>
          </h1>
          <p style={{ fontSize:"clamp(16px,2vw,20px)", color:C.muted, maxWidth:600,
            margin:"0 auto 40px", lineHeight:1.7 }}>
            Replace scattered WhatsApp conversations, spreadsheets, and manual follow-ups
            with one centralized workspace for your Visual Merchandising team.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={openDemo} style={{ background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff", padding:"16px 36px", borderRadius:12,
              fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 0 32px ${C.indigo}55` }}>Request a Demo →</button>
            <button onClick={onEnterApp} style={{ background:"transparent", border:`1px solid ${C.border}`,
              color:C.text, padding:"16px 32px", borderRadius:12, fontSize:16,
              fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sign In</button>
          </div>
        </div>
        <div style={{ padding:"60px 24px 0" }}><DashMockup /></div>
      </div>

      {/* STATS */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, background:C.surface }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:"48px 24px",
          display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24, textAlign:"center" }}>
          {[["500+","VM Professionals"],["98%","Task Completion Rate"],["3x","Faster Execution"],["40hrs","Saved / Manager / Month"]].map(([n,l]) => (
            <div key={l}>
              <div style={{ fontSize:36, fontWeight:800,
                background:`linear-gradient(135deg,${C.indigoL},${C.cyan})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{n}</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY */}
      <div style={{ padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>The Problem</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
              VM teams are stuck in the old way
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            {[["❌","Lost in WhatsApp","Critical instructions buried in crowded group chats. Photos without context. Follow-ups that never end."],
              ["❌","Manual Spreadsheets","Hours spent updating Excel files that are outdated before they're finished."],
              ["❌","No Visibility","Managers can't tell which branches executed and which didn't — until it's too late."],
              ["❌","Missed Visits","Store visit reports written on paper or forgotten entirely. No accountability trail."]].map(([icon,title,desc]) => (
              <div key={title} style={{ background:C.card, border:`1px solid #EF444422`, borderRadius:16, padding:28 }}>
                <div style={{ fontSize:24, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:"#F87171" }}>{title}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ background:C.surface, padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>Features</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
              Everything your VM team needs
            </h2>
            <p style={{ color:C.muted, fontSize:16, maxWidth:500, margin:"0 auto" }}>
              Built specifically for Visual Merchandising — not adapted from generic task software.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18 }}>
            {[["✅","Task Management","Assign to specific staff or entire teams. Track completion in real-time across every branch."],
              ["🚶","Store Visit Reports","Document visits with photos and per-photo comments. Convert findings to tasks instantly."],
              ["📸","Before & After","Auto-compressed photos organized by category, branch, and timestamp."],
              ["📋","Floor Walk Reports","Publish instructions with reference photos visible to VM staff immediately."],
              ["📖","Guidelines Library","Upload PDFs. Staff search, view in-app, and acknowledge — you see who reviewed."],
              ["🏷️","Demo Hold Tracker","Log display items with SKU. Print professional PDF reports instantly."],
              ["📅","Weekly Planning","Visual staff × days grid. Each VM sees their personal weekly plan."],
              ["🎓","Training Module","Log attendance, scores, and notes for every training session."],
              ["💬","Branch Chat Rooms","Separate room per branch + team channel + managers-only room."],
              ["📣","Campaign Tracking","Auto-track completion % per branch with live dashboard."],
              ["🔔","Smart Notifications","Every event triggers instant in-app notifications to the right people."],
              ["📊","Analytics","Branch comparisons and performance insights — zero manual work."]].map(([icon,title,desc]) => (
              <div key={title} style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, padding:22, cursor:"default",
                transition:"border-color .2s, transform .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.indigo; e.currentTarget.style.transform="translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="none"; }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" style={{ padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>How It Works</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0" }}>
              Up and running in minutes
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24, position:"relative" }}>
            <div style={{ position:"absolute", top:32, left:"12.5%", right:"12.5%", height:1,
              background:`linear-gradient(90deg,${C.indigo},${C.cyan})`, opacity:.3 }}/>
            {[["01","Create Tasks","Set up tasks for specific staff or all branches with priorities and due dates"],
              ["02","Assign Teams","Staff see their tasks instantly. No WhatsApp, no calls, no confusion"],
              ["03","Track Execution","Real-time updates as staff complete and submit photo reports"],
              ["04","Analyze","Branch comparisons and performance insights to continuously improve"]].map(([n,t,d]) => (
              <div key={n} style={{ textAlign:"center", position:"relative" }}>
                <div style={{ width:64, height:64, borderRadius:"50%",
                  background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:18, fontWeight:800, margin:"0 auto 20px",
                  boxShadow:`0 0 24px ${C.indigo}44` }}>{n}</div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{t}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROLES */}
      <div style={{ background:C.surface, padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>Role-Based Access</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0" }}>
              Every role sees only what they need
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
            {[["👔","VM Controller","Creates tasks, weekly plans, training sessions, and reviews all VM submissions.",C.indigo],
              ["🚶","Area Manager","Conducts store visits, publishes floor walks, monitors branch progress.",C.cyan],
              ["✅","VM Staff","Sees assigned tasks, submits Before/After reports, views guidelines and weekly plan.",C.green]].map(([icon,role,desc,color]) => (
              <div key={role} style={{ background:C.card, border:`1px solid ${color}33`,
                borderRadius:16, padding:28, borderTop:`3px solid ${color}` }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{icon}</div>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:8, color }}>{role}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{ padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>Pricing</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0" }}>
              Simple, transparent pricing
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20, maxWidth:900, margin:"0 auto" }}>
            {[{ name:"Starter", price:"799", sub:"Saves 20+ hrs/month", features:["Up to 3 branches","All core features","Email support"], popular:false },
              { name:"Growth",  price:"1,499", sub:"Saves 40+ hrs/month", features:["Up to 8 branches","All features + Analytics","Priority support"], popular:true },
              { name:"Enterprise", price:"Custom", sub:"Fully tailored", features:["Unlimited branches","Custom integrations","Dedicated account manager"], popular:false }].map(p => (
              <div key={p.name} style={{ background:p.popular?`${C.indigo}11`:C.card,
                border:p.popular?`2px solid ${C.indigo}`:`1px solid ${C.border}`,
                borderRadius:20, padding:32, position:"relative" }}>
                {p.popular && (
                  <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)",
                    background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
                    color:"#fff", padding:"3px 14px", borderRadius:100, fontSize:11, fontWeight:700 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{p.name}</div>
                <div style={{ marginBottom:20 }}>
                  <span style={{ fontSize:36, fontWeight:800,
                    background:`linear-gradient(135deg,${C.indigoL},${C.cyan})`,
                    WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                    {p.price==="Custom" ? "Custom" : `SAR ${p.price}`}
                  </span>
                  {p.price!=="Custom" && <span style={{ fontSize:13, color:C.muted }}>/mo</span>}
                </div>
                <div style={{ fontSize:12, color:C.green, marginBottom:4, fontWeight:600 }}>{p.sub}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display:"flex", gap:8, alignItems:"center", fontSize:13 }}>
                      <span style={{ color:C.green }}>✓</span>
                      <span style={{ color:C.muted }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={openDemo} style={{ width:"100%", padding:"11px", borderRadius:10,
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", border:"none",
                  background:p.popular?`linear-gradient(135deg,${C.indigo},${C.indigoL})`:C.surface,
                  color:p.popular?"#fff":C.text }}>
                  {p.price==="Custom" ? "Contact Sales" : "Request Demo"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EARLY ADOPTERS CTA */}
      <div style={{ background:C.surface, padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center" }}>
          <Tag>Early Access</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:800, margin:"20px 0 16px" }}>
            Be the first in your market
          </h2>
          <p style={{ fontSize:16, color:C.muted, lineHeight:1.8, marginBottom:48, maxWidth:560, margin:"0 auto 48px" }}>
            Vismo is launching in Saudi Arabia. Early adopters get priority onboarding,
            direct access to the product team, and locked-in pricing before public release.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16, maxWidth:680, margin:"0 auto 48px" }}>
            {[["🎯","Priority Setup","Your company configured and ready within 24 hours"],
              ["💬","Direct Access","Work directly with the product team to shape features"],
              ["🔒","Locked Pricing","Early adopter rate locked in before public pricing increases"]].map(([icon,title,desc]) => (
              <div key={title} style={{ background:C.card, border:`1px solid ${C.indigo}33`,
                borderRadius:14, padding:22, borderTop:`2px solid ${C.indigo}` }}>
                <div style={{ fontSize:24, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
          <button onClick={openDemo} style={{ background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
            border:"none", color:"#fff", padding:"16px 36px", borderRadius:12,
            fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 0 28px ${C.indigo}44` }}>
            Request Early Access →
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" style={{ padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)" }}>
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <Tag>FAQ</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0" }}>Common questions</h2>
          </div>
          {[["Do I need to download an app?","No — Vismo is a PWA. Works on any phone directly from the browser. Staff can add it to their home screen for a native app feel."],
            ["How does onboarding work?","After your demo, we set up your company, add your branches and categories, and generate invite codes for your team. You're operational the same day."],
            ["Is our data safe?","Yes. Every company's data is completely isolated using PostgreSQL Row Level Security. Enforced at the database level — not just application code."],
            ["Can we customize it for our brand?","Yes — company logo, brand colors, and custom categories. Enterprise plans include deeper customization."],
            ["Does it work offline?","Yes. Submissions queue offline and sync automatically when connection is restored. Zero data loss."],
            ["What languages are supported?","The interface is in English. Arabic RTL support is on our roadmap."]].map(([q,a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div style={{ padding:"clamp(56px,8vw,100px) clamp(16px,4vw,32px)", textAlign:"center",
        background:`radial-gradient(ellipse 800px 400px at 50% 100%, ${C.indigo}22, transparent)`,
        borderTop:`1px solid ${C.border}` }}>
        <Tag>Get Started</Tag>
        <h2 style={{ fontSize:"clamp(32px,5vw,56px)", fontWeight:800, margin:"20px auto 16px",
          maxWidth:580, letterSpacing:-1 }}>
          Ready to simplify Visual Merchandising?
        </h2>
        <p style={{ fontSize:17, color:C.muted, marginBottom:40, maxWidth:460, margin:"0 auto 40px" }}>
          Join VM teams across Saudi Arabia who've replaced chaos with clarity.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={openDemo} style={{ background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
            border:"none", color:"#fff", padding:"18px 40px", borderRadius:12,
            fontSize:17, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 0 40px ${C.indigo}55` }}>Request a Demo →</button>
          <button onClick={onEnterApp} style={{ background:"transparent", border:`1px solid ${C.border}`,
            color:C.text, padding:"18px 32px", borderRadius:12, fontSize:17,
            fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sign In</button>
        </div>
        <p style={{ fontSize:12, color:C.muted, marginTop:16 }}>Built in Saudi Arabia · For GCC retail brands</p>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"40px 24px", background:C.surface }}>
        <div style={{ maxWidth:1180, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
          <img src="/logo-dark.webp" alt="Vismo" style={{ height:26, objectFit:"contain" }}
            onError={e => { e.target.style.display="none"; }}/>
          <div style={{ display:"flex", gap:20 }}>
            <a href="mailto:info@vismo1.com" style={{ fontSize:13, color:C.indigoL, textDecoration:"none" }}>info@vismo1.com</a>
          {["Features","Pricing","FAQ","Privacy","Terms"].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:C.muted, textDecoration:"none" }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize:12, color:C.muted }}>© 2026 Vismo · Visual Merchandising Operations Platform</div>
        </div>
      </footer>
    </div>
  );
}