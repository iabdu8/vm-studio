import { useState, useEffect, useRef } from "react";

// ── Palette ──────────────────────────────────────────────────
// #0A0A12 deep navy bg
// #4F46E5 indigo primary
// #818CF8 indigo-300 accent
// #06B6D4 cyan highlight
// #1E1B4B indigo-950 surface
// #F8FAFC off-white text

const C = {
  bg:      "#0A0A12",
  surface: "#0F0F1E",
  card:    "#14142A",
  border:  "#1E1E3A",
  indigo:  "#4F46E5",
  indigoL: "#818CF8",
  cyan:    "#06B6D4",
  text:    "#F8FAFC",
  muted:   "#94A3B8",
  green:   "#10B981",
  red:     "#EF4444",
};

// ── Reusable atoms ────────────────────────────────────────────
const Tag = ({ children }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:6,
    background:`${C.indigo}18`, color:C.indigoL,
    border:`1px solid ${C.indigo}44`,
    padding:"4px 14px", borderRadius:100,
    fontSize:12, fontWeight:600, letterSpacing:.5, textTransform:"uppercase",
  }}>{children}</span>
);

const Btn = ({ children, variant="primary", onClick, href }) => {
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    padding:"14px 28px", borderRadius:12, fontWeight:700, fontSize:15,
    cursor:"pointer", border:"none", fontFamily:"inherit",
    transition:"all .2s", textDecoration:"none",
  };
  const styles = variant === "primary"
    ? { ...base, background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`, color:"#fff",
        boxShadow:`0 0 28px ${C.indigo}44` }
    : { ...base, background:"transparent", color:C.text,
        border:`1px solid ${C.border}`, backdropFilter:"blur(8px)" };

  const El = href ? "a" : "button";
  return <El href={href} style={styles} onClick={onClick}>{children}</El>;
};

// ── Animated counter ──────────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = to / 60;
      const t = setInterval(() => {
        start += step;
        if (start >= to) { setVal(to); clearInterval(t); }
        else setVal(Math.floor(start));
      }, 16);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Section wrapper ───────────────────────────────────────────
const Section = ({ children, style }) => (
  <section style={{ padding:"100px 24px", maxWidth:1180, margin:"0 auto", ...style }}>
    {children}
  </section>
);

// ── Dashboard mockup ──────────────────────────────────────────
function DashMockup() {
  return (
    <div style={{
      position:"relative", borderRadius:20, overflow:"hidden",
      border:`1px solid ${C.border}`,
      background:C.card,
      boxShadow:`0 40px 120px #00000088, 0 0 0 1px ${C.border}`,
      maxWidth:860, margin:"0 auto",
    }}>
      {/* Top bar */}
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#EF4444" }}/>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#F59E0B" }}/>
        <div style={{ width:12,height:12,borderRadius:"50%",background:"#10B981" }}/>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:`${C.border}88`,
            padding:"4px 16px", borderRadius:8, fontSize:12, color:C.muted }}>
            🔒 vismo1.com
          </div>
        </div>
      </div>

      {/* App shell */}
      <div style={{ display:"flex", height:440 }}>
        {/* Sidebar */}
        <div style={{ width:200, borderRight:`1px solid ${C.border}`, padding:16,
          display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px",
            marginBottom:12 }}>
            <img src="/logo.webp" alt="Vismo" style={{ height:28, objectFit:"contain" }}
              onError={e => { e.target.style.display="none"; }}/>
          </div>
          {[["📊","Overview","active"],["✅","Tasks",""],["🚶","Visits",""],
            ["📖","Guidelines",""],["💬","Chat",""],["🎓","Training",""]].map(([icon,label,active]) => (
            <div key={label} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 12px", borderRadius:10,
              background: active ? `${C.indigo}22` : "transparent",
              color: active ? C.indigoL : C.muted, fontSize:13, fontWeight: active ? 600 : 400,
            }}>
              <span style={{ fontSize:14 }}>{icon}</span>{label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:20, overflowY:"hidden" }}>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Operations Overview</div>

          {/* KPI row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {[["128","Total Tasks","📋"],["96","Completed","✅"],["24","In Progress","🔄"],["8","Overdue","⚠️"]].map(([n,l,icon]) => (
              <div key={l} style={{ background:C.surface, border:`1px solid ${C.border}`,
                borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:.5 }}>{icon} {l}</div>
                <div style={{ fontSize:24, fontWeight:800, color: l==="Overdue"?"#F87171":C.text }}>{n}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Recent Tasks</div>
              {[["Window Display","Sultan Mall","done"],["New Promo Setup","Jeddah Park","progress"],
                ["Shelf Organization","Bawadi","pending"]].map(([t,b,s]) => (
                <div key={t} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{t}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{b}</div>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20,
                    background: s==="done"?"#10B98122":s==="progress"?`${C.indigo}22`:"#F59E0B22",
                    color: s==="done"?"#10B981":s==="progress"?C.indigoL:"#F59E0B" }}>
                    {s==="done"?"Done":s==="progress"?"In Progress":"Pending"}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Branch Progress</div>
              {[["Sultan Mall",85],["Jeddah Park",62],["Mall of Arabia",40],["Bawadi",91]].map(([b,p]) => (
                <div key={b} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span>{b}</span>
                    <span style={{ color:C.indigoL, fontWeight:700 }}>{p}%</span>
                  </div>
                  <div style={{ height:4, background:C.border, borderRadius:2 }}>
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

// ── Main Landing Page ─────────────────────────────────────────
export function LandingPage({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ background:C.bg, color:C.text, fontFamily:"'DM Sans',sans-serif",
      minHeight:"100vh", overflowX:"hidden" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        padding:"0 32px",
        background: scrolled ? `${C.surface}ee` : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition:"all .3s",
      }}>
        <div style={{ maxWidth:1180, margin:"0 auto", height:64,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/logo-dark.webp" alt="Vismo" style={{ height:36, objectFit:"contain" }}
              onError={e => { e.target.style.display="none"; }}/>
          </div>

          <div style={{ display:"flex", gap:32, alignItems:"center" }}>
            {[["Features","#features"],["How it works","#how"],["Pricing","#pricing"],["FAQ","#faq"]].map(([l,h]) => (
              <a key={l} href={h} style={{ color:C.muted, fontSize:14, fontWeight:500,
                textDecoration:"none", transition:"color .2s" }}
                onMouseEnter={e=>e.target.style.color=C.text}
                onMouseLeave={e=>e.target.style.color=C.muted}>{l}</a>
            ))}
          </div>

          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button onClick={onEnterApp} style={{
              background:"transparent", border:`1px solid ${C.border}`, color:C.text,
              padding:"8px 20px", borderRadius:10, cursor:"pointer", fontSize:14,
              fontWeight:600, fontFamily:"inherit",
            }}>Sign In</button>
            <button onClick={onEnterApp} style={{
              background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff",
              padding:"8px 20px", borderRadius:10, cursor:"pointer", fontSize:14,
              fontWeight:700, fontFamily:"inherit",
              boxShadow:`0 0 20px ${C.indigo}44`,
            }}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ paddingTop:160, paddingBottom:80, textAlign:"center",
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
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onEnterApp} style={{
              background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
              border:"none", color:"#fff", padding:"16px 32px", borderRadius:12,
              fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              boxShadow:`0 0 32px ${C.indigo}55`,
            }}>Start Free Trial →</button>
            <button onClick={onEnterApp} style={{
              background:"transparent", border:`1px solid ${C.border}`, color:C.text,
              padding:"16px 32px", borderRadius:12, fontSize:16, fontWeight:600,
              cursor:"pointer", fontFamily:"inherit",
            }}>Sign In</button>
          </div>
          <p style={{ fontSize:12, color:C.muted, marginTop:14 }}>
            No credit card required · Setup in 2 minutes
          </p>
        </div>

        {/* Dashboard mockup */}
        <div style={{ padding:"60px 24px 0" }}>
          <DashMockup />
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`,
        background:C.surface }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:"48px 24px",
          display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24, textAlign:"center" }}>
          {[["500+","VM Professionals","Teams using Vismo"],
            ["98","%","Task completion rate"],
            ["3x","Faster","Execution speed"],
            ["40","hrs","Saved per manager/month"]].map(([n,s,l]) => (
            <div key={l}>
              <div style={{ fontSize:40, fontWeight:800,
                background:`linear-gradient(135deg,${C.indigoL},${C.cyan})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                {n}<span style={{ fontSize:24 }}>{s}</span>
              </div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY VISMO ── */}
      <Section id="why">
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <Tag>The Problem</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
            VM teams are stuck in the old way
          </h2>
          <p style={{ color:C.muted, fontSize:17, maxWidth:520, margin:"0 auto" }}>
            Every day, visual merchandisers waste hours on manual coordination that should take minutes.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
          {[
            ["❌","Lost in WhatsApp","Critical instructions buried in crowded group chats. Photos without context. Follow-ups that never end."],
            ["❌","Manual Spreadsheets","Hours spent updating Excel files that are outdated before they're finished."],
            ["❌","No Visibility","Managers can't tell which branches executed and which didn't — until it's too late."],
            ["❌","Missed Visits","Store visit reports written on paper or forgotten entirely. No accountability trail."],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ background:C.card, border:`1px solid #EF444422`,
              borderRadius:16, padding:28 }}>
              <div style={{ fontSize:24, marginBottom:12 }}>{icon}</div>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:8, color:"#F87171" }}>{title}</div>
              <div style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>{desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section id="features" style={{ background:C.surface, maxWidth:"100%", padding:"100px 24px" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <Tag>Features</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
              Everything your VM team needs
            </h2>
            <p style={{ color:C.muted, fontSize:17, maxWidth:520, margin:"0 auto" }}>
              Built specifically for Visual Merchandising — not adapted from generic task software.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {[
              ["✅","Task Management","Assign tasks to specific staff or entire teams. Track completion in real-time across every branch."],
              ["🚶","Store Visit Reports","Document branch visits with photos and per-photo comments. Convert findings to tasks instantly."],
              ["📸","Before & After","Auto-compressed photo submissions organized by category, branch, and timestamp."],
              ["📋","Floor Walk Reports","Publish floor walk instructions with reference photos visible to VM staff immediately."],
              ["📖","Guidelines Library","Upload PDF guidelines. Staff search, view in-app, and acknowledge — you see who reviewed."],
              ["🏷️","Demo Hold Tracker","Log display items with SKU and location. Print professional PDF reports instantly."],
              ["📅","Weekly Planning","Visual staff × days grid. Each VM sees their personal plan for the week."],
              ["🎓","Training Module","Log attendance, scores, and notes for every training session per team member."],
              ["💬","Branch Chat Rooms","Separate room per branch + company-wide channel + managers-only private room."],
              ["📣","Campaign Tracking","Launch campaigns and auto-track completion % per branch with live dashboard."],
              ["🔔","Smart Notifications","Every event triggers instant in-app notifications to exactly the right people."],
              ["📊","Analytics","Performance stats, branch comparisons, and photo reports — zero manual work."],
            ].map(([icon,title,desc]) => (
              <div key={title} style={{
                background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24,
                transition:"border-color .2s, transform .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=C.indigo; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="none"; }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how">
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <Tag>How It Works</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
            Up and running in minutes
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24, position:"relative" }}>
          {/* connector line */}
          <div style={{ position:"absolute", top:32, left:"12.5%", right:"12.5%", height:1,
            background:`linear-gradient(90deg,${C.indigo},${C.cyan})`, opacity:.3 }}/>
          {[
            ["01","Create Tasks","Set up tasks for specific staff or all branches with priorities and due dates"],
            ["02","Assign Teams","Staff see their tasks instantly. No WhatsApp, no calls, no confusion"],
            ["03","Track Execution","Real-time updates as staff complete tasks and submit photo reports"],
            ["04","Analyze & Improve","Branch comparisons and performance insights to continuously improve"],
          ].map(([n,t,d]) => (
            <div key={n} style={{ textAlign:"center", position:"relative" }}>
              <div style={{
                width:64, height:64, borderRadius:"50%",
                background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, fontWeight:800, margin:"0 auto 20px",
                boxShadow:`0 0 24px ${C.indigo}44`,
              }}>{n}</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{t}</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>{d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ROLES ── */}
      <div style={{ background:C.surface, padding:"100px 24px" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <Tag>Role-Based Access</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
              Every role sees only what they need
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {[
              ["👔","VM Controller","Creates tasks, weekly plans, training sessions, and reviews all VM submissions with approve/revision flow.","#4F46E5"],
              ["🚶","Area Manager","Conducts store visits, publishes floor walks, and monitors branch execution progress.","#06B6D4"],
              ["✅","VM Staff","Sees assigned tasks, submits Before/After reports, views guidelines, and tracks their weekly plan.","#10B981"],
            ].map(([icon,role,desc,color]) => (
              <div key={role} style={{ background:C.card, border:`1px solid ${color}33`,
                borderRadius:16, padding:28, borderTop:`3px solid ${color}` }}>
                <div style={{ fontSize:32, marginBottom:14 }}>{icon}</div>
                <div style={{ fontSize:18, fontWeight:700, marginBottom:8, color }}>{role}</div>
                <div style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <Section id="pricing">
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <Tag>Pricing</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
            Simple, transparent pricing
          </h2>
          <p style={{ color:C.muted, fontSize:17 }}>Start free. Scale as you grow.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, maxWidth:900, margin:"0 auto" }}>
          {[
            { name:"Starter", price:"799", period:"mo", features:["Up to 3 branches","All core features","Email support","Real-time notifications"], popular:false },
            { name:"Growth", price:"1,499", period:"mo", features:["Up to 8 branches","All features + Analytics","Priority support","Advanced training module"], popular:true },
            { name:"Enterprise", price:"Custom", period:"", features:["Unlimited branches","Custom integrations","Dedicated account manager","On-site onboarding"], popular:false },
          ].map(p => (
            <div key={p.name} style={{
              background: p.popular ? `linear-gradient(135deg,${C.indigo}22,${C.indigoL}11)` : C.card,
              border: p.popular ? `2px solid ${C.indigo}` : `1px solid ${C.border}`,
              borderRadius:20, padding:32, position:"relative",
            }}>
              {p.popular && (
                <div style={{ position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
                  background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
                  color:"#fff", padding:"4px 16px", borderRadius:100, fontSize:11, fontWeight:700 }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{p.name}</div>
              <div style={{ marginBottom:24 }}>
                <span style={{ fontSize:40, fontWeight:800,
                  background:`linear-gradient(135deg,${C.indigoL},${C.cyan})`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  {p.price === "Custom" ? "Custom" : `SAR ${p.price}`}
                </span>
                {p.period && <span style={{ fontSize:14, color:C.muted }}>/{p.period}</span>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display:"flex", gap:10, alignItems:"center", fontSize:14 }}>
                    <span style={{ color:C.green, fontSize:16 }}>✓</span>
                    <span style={{ color:C.muted }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onEnterApp} style={{
                width:"100%", padding:"12px", borderRadius:12, fontWeight:700,
                fontSize:14, cursor:"pointer", fontFamily:"inherit", border:"none",
                background: p.popular ? `linear-gradient(135deg,${C.indigo},${C.indigoL})` : C.surface,
                color: p.popular ? "#fff" : C.text,
              }}>
                {p.price === "Custom" ? "Contact Sales" : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background:C.surface, padding:"100px 24px" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:64 }}>
            <Tag>Testimonials</Tag>
            <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0 12px" }}>
              Trusted by VM teams across the GCC
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {[
              { name:"Sara Al-Qahtani", role:"VM Manager, Home Centre", quote:"Vismo cut our weekly reporting time by 70%. Managers now spend time leading, not chasing updates." },
              { name:"Ahmad Al-Shammari", role:"Area Manager, R&B", quote:"The store visit reports are incredible. Before/After photos organized by branch — exactly what we needed." },
              { name:"Reem Al-Dosari", role:"VM Controller, Abyat", quote:"Training module alone is worth it. We track attendance and scores for every session without any paperwork." },
            ].map(t => (
              <div key={t.name} style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, padding:28 }}>
                <div style={{ fontSize:32, marginBottom:16, color:C.indigo }}>❝</div>
                <p style={{ fontSize:15, lineHeight:1.8, color:C.muted, marginBottom:20 }}>{t.quote}</p>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <Section id="faq">
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <Tag>FAQ</Tag>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, margin:"16px 0" }}>
            Common questions
          </h2>
        </div>
        <div style={{ maxWidth:720, margin:"0 auto", display:"flex", flexDirection:"column", gap:2 }}>
          {[
            ["Do I need to download an app?", "No — Vismo is a PWA. It works on any phone or computer directly from the browser. Staff can add it to their home screen for a native app experience."],
            ["How do invite codes work?", "Each company gets 3 invite codes: one for VM Staff, one for VM Controllers, and one for Area Managers. Staff register with the code matching their role and join automatically."],
            ["Is our data safe?", "Yes. Every company's data is completely isolated using PostgreSQL Row Level Security. R&B data is mathematically inaccessible to Home Centre, enforced at the database level."],
            ["Can we try it before paying?", "Yes — start with a free trial. No credit card required. You're up and running in under 2 minutes."],
            ["Does it work offline?", "Yes. Submissions queue offline and sync automatically when connection is restored. Zero data loss."],
            ["Is Arabic supported?", "The interface is in English. Arabic RTL support is on our roadmap for Q3 2025."],
          ].map(([q, a]) => (
            <FaqItem key={q} q={q} a={a} />
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <div style={{
        padding:"100px 24px", textAlign:"center",
        background:`radial-gradient(ellipse 800px 400px at 50% 100%, ${C.indigo}22, transparent)`,
        borderTop:`1px solid ${C.border}`,
      }}>
        <Tag>Get Started Today</Tag>
        <h2 style={{ fontSize:"clamp(32px,5vw,60px)", fontWeight:800, margin:"20px auto 16px",
          maxWidth:640, letterSpacing:-1 }}>
          Ready to simplify Visual Merchandising?
        </h2>
        <p style={{ fontSize:18, color:C.muted, marginBottom:40, maxWidth:480, margin:"0 auto 40px" }}>
          Join VM teams across Saudi Arabia and the GCC who've replaced chaos with clarity.
        </p>
        <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
          <button onClick={onEnterApp} style={{
            background:`linear-gradient(135deg,${C.indigo},${C.indigoL})`,
            border:"none", color:"#fff", padding:"18px 40px", borderRadius:12,
            fontSize:17, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            boxShadow:`0 0 40px ${C.indigo}55`,
          }}>Start Free Trial →</button>
          <button onClick={onEnterApp} style={{
            background:"transparent", border:`1px solid ${C.border}`, color:C.text,
            padding:"18px 40px", borderRadius:12, fontSize:17, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>Sign In</button>
        </div>
        <p style={{ fontSize:12, color:C.muted, marginTop:16 }}>
          Built in Saudi Arabia · For GCC retail brands
        </p>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"48px 24px",
        background:C.surface }}>
        <div style={{ maxWidth:1180, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/logo-dark.webp" alt="Vismo" style={{ height:28, objectFit:"contain" }}
              onError={e => { e.target.style.display="none"; }}/>
          </div>
          <div style={{ display:"flex", gap:24 }}>
            {["Features","Pricing","FAQ","Privacy","Terms"].map(l => (
              <a key={l} href="#" style={{ fontSize:13, color:C.muted, textDecoration:"none" }}>{l}</a>
            ))}
          </div>
          <div style={{ fontSize:12, color:C.muted }}>
            © 2026 Vismo · Visual Merchandising Operations Platform
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden",
      marginBottom:4, background:C.card }}>
      <button onClick={() => setOpen(!open)} style={{
        width:"100%", textAlign:"left", padding:"20px 24px",
        background:"transparent", border:"none", color:C.text,
        fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        {q}
        <span style={{ color:C.indigoL, fontSize:20, transition:"transform .2s",
          transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      {open && (
        <div style={{ padding:"0 24px 20px", fontSize:14, color:C.muted, lineHeight:1.8 }}>
          {a}
        </div>
      )}
    </div>
  );
}