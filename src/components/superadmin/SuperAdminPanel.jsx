import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { signOut } from "../../services/auth.service.js";
import {
  getAllCompanies, createCompany, deleteCompany,
  updateSettings, getCategoriesForCompany,
  adminCreateCategory, adminDeleteCategory,
  getAllUsers, updateUserRole, assignUserToCompany,
} from "../../services/superadmin.service.js";

const S = {
  wrap:   { minHeight:"100vh", background:"#0a0a0f", color:"#f0ede8", fontFamily:"'DM Sans',sans-serif", padding:"20px 18px", paddingBottom:80 },
  card:   { background:"#13131a", border:"1px solid #a855f722", borderRadius:14, padding:"18px 20px", marginBottom:14 },
  h1:     { fontSize:22, fontWeight:700, color:"#a855f7", marginBottom:4, fontFamily:"'Cormorant Garamond',serif" },
  h3:     { fontSize:11, fontWeight:700, color:"#6b6880", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 },
  tab:    (a) => ({ padding:"8px 15px", cursor:"pointer", fontSize:13, fontWeight:a?600:400, color:a?"#a855f7":"#6b6880", background:a?"#a855f718":"transparent", borderRadius:8, border:a?"1px solid #a855f733":"1px solid transparent", transition:"all .2s", fontFamily:"'DM Sans',sans-serif" }),
  inp:    { width:"100%", background:"#0a0a0f", border:"1px solid #a855f722", borderRadius:10, padding:"9px 13px", color:"#f0ede8", fontSize:13, marginTop:4, marginBottom:12, fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" },
  sel:    { width:"100%", background:"#0a0a0f", border:"1px solid #a855f722", borderRadius:10, padding:"9px 13px", color:"#f0ede8", fontSize:13, marginBottom:12, fontFamily:"'DM Sans',sans-serif" },
  lbl:    { fontSize:11, color:"#6b6880", fontWeight:600, letterSpacing:1, textTransform:"uppercase" },
  btnP:   { background:"#a855f7", color:"#fff", border:"none", padding:"9px 18px", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif" },
  btnG:   { background:"transparent", color:"#6b6880", border:"1px solid #6b688033", padding:"8px 14px", borderRadius:9, cursor:"pointer", fontSize:13, fontFamily:"'DM Sans',sans-serif" },
  btnDel: { background:"#f8717122", color:"#f87171", border:"1px solid #f8717133", padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:12 },
  btnOut: { background:"transparent", color:"#f87171", border:"1px solid #f8717133", padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontFamily:"'DM Sans',sans-serif" },
  chip:   (r) => ({ display:"inline-block", padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:r==="super_admin"?"#a855f722":r==="manager"?"#c8a96e22":"#818cf822", color:r==="super_admin"?"#a855f7":r==="manager"?"#c8a96e":"#818cf8" }),
  row:    { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #ffffff08" },
  toggle: (on) => ({ position:"relative", width:40, height:22, borderRadius:11, background:on?"#a855f7":"#333", cursor:"pointer", border:"none", transition:"background .2s", flexShrink:0 }),
  toggleDot: (on) => ({ position:"absolute", top:3, left:on?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }),
};

export function SuperAdminPanel() {
  const { profile } = useApp();
  const [tab, setTab] = useState("companies");

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>🛡️</span>
          <div>
            <div style={S.h1}>Super Admin</div>
            <div style={{ fontSize:12, color:"#6b6880" }}>{profile?.full_name}</div>
          </div>
        </div>
        <button style={S.btnOut} onClick={() => signOut()}>Sign Out</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
        {[["companies","🏢 Companies"],["categories","📂 Categories"],["users","👥 Users"],["settings","⚙️ Settings"]].map(([k,l]) => (
          <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab==="companies"  && <CompaniesTab />}
      {tab==="categories" && <CategoriesTab />}
      {tab==="users"      && <UsersTab />}
      {tab==="settings"   && <SettingsTab />}
    </div>
  );
}

function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ name:"", slug:"", primary_color:"#c8a96e", accent_color:"#c8a96e" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { getAllCompanies().then(setCompanies); }, []);

  const add = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      const c = await createCompany(form);
      setCompanies(p => [...p, c]);
      setForm({ name:"", slug:"", primary_color:"#c8a96e", accent_color:"#c8a96e" });
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm("Delete this company and ALL its data?")) return;
    await deleteCompany(id);
    setCompanies(p => p.filter(c => c.id !== id));
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.h3}>New Company</div>
        <div style={S.lbl}>Company Name</div>
        <input style={S.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Home Centre" />
        <div style={S.lbl}>Slug (unique key)</div>
        <input style={S.inp} value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")}))} placeholder="e.g. homecentre" />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            <div style={S.lbl}>Primary Color</div>
            <input type="color" style={{...S.inp,height:44,padding:4}} value={form.primary_color} onChange={e=>setForm(p=>({...p,primary_color:e.target.value}))} />
          </div>
          <div>
            <div style={S.lbl}>Accent Color</div>
            <input type="color" style={{...S.inp,height:44,padding:4}} value={form.accent_color} onChange={e=>setForm(p=>({...p,accent_color:e.target.value}))} />
          </div>
        </div>
        <button style={S.btnP} onClick={add} disabled={saving}>{saving?"Creating…":"Create Company →"}</button>
      </div>

      <div style={S.h3}>All Companies ({companies.length})</div>
      {companies.map(c => (
        <div key={c.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            {c.logo_url
              ? <img src={c.logo_url} style={{ width:36, height:36, objectFit:"contain", borderRadius:8 }} alt={c.name}/>
              : <div style={{ width:36, height:36, borderRadius:10, background:c.accent_color, flexShrink:0 }}/>
            }
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{c.name}</div>
              <div style={{ fontSize:11, color:"#6b6880" }}>/{c.slug} · {c.is_active?"✓ Active":"✗ Inactive"}</div>
              <div style={{ fontSize:11, color:"#a855f7", fontWeight:700, marginTop:2, letterSpacing:1 }}>
                🔑 {c.invite_code ?? "—"}
              </div>
            </div>
          </div>
          <button style={S.btnDel} onClick={()=>del(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function CategoriesTab() {
  const [companies, setCompanies] = useState([]);
  const [selected,  setSelected]  = useState("");
  const [cats,      setCats]      = useState([]);
  const [name, setName]           = useState("");
  const [icon, setIcon]           = useState("📦");
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => { getAllCompanies().then(setCompanies); }, []);
  useEffect(() => {
    if (selected) getCategoriesForCompany(selected).then(setCats);
    else setCats([]);
  }, [selected]);

  const addCat = async () => {
    if (!name || !selected) return;
    const c = await adminCreateCategory({ company_id:selected, name, icon, sort_order:cats.length+1 });
    setCats(p => [...p, {...c, subcategories:[]}]); setName(""); setIcon("📦");
  };

  const delCat = async (id) => {
    await adminDeleteCategory(id);
    setCats(p => p.filter(c => c.id !== id));
    if (expanded === id) setExpanded(null);
  };

  return (
    <div>
      <div style={S.card}>
        <div style={S.lbl}>Select Company</div>
        <select style={S.sel} value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">— choose a company —</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selected && (
          <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
            <div style={{ flex:1 }}>
              <div style={S.lbl}>Category Name</div>
              <input style={{...S.inp,marginBottom:0}} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Men's" />
            </div>
            <div>
              <div style={S.lbl}>Icon</div>
              <input style={{...S.inp,width:56,textAlign:"center",marginBottom:0}} value={icon} onChange={e=>setIcon(e.target.value)} />
            </div>
            <button style={{...S.btnP,flexShrink:0,marginBottom:12}} onClick={addCat}>Add</button>
          </div>
        )}
      </div>

      {cats.map(c => (
        <div key={c.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:14 }}>{c.icon} {c.name}</span>
            <div style={{ display:"flex", gap:8 }}>
              <button style={S.btnG} onClick={()=>setExpanded(expanded===c.id?null:c.id)}>
                {expanded===c.id?"▲":"▼"} Sections
              </button>
              <button style={S.btnDel} onClick={()=>delCat(c.id)}>Del</button>
            </div>
          </div>
          {expanded===c.id && (
            <SubEditor category={c} companyId={selected} onRefresh={()=>getCategoriesForCompany(selected).then(setCats)} />
          )}
        </div>
      ))}
    </div>
  );
}

function SubEditor({ category, companyId, onRefresh }) {
  const [name, setName] = useState("");
  const add = async () => {
    if (!name) return;
    const { supabase } = await import("../../lib/supabase.js");
    await supabase.from("subcategories").insert({ company_id:companyId, category_id:category.id, name, sort_order:(category.subcategories?.length??0)+1 });
    setName(""); onRefresh();
  };
  const del = async (id) => {
    const { supabase } = await import("../../lib/supabase.js");
    await supabase.from("subcategories").delete().eq("id",id); onRefresh();
  };
  return (
    <div style={{ marginTop:12, paddingLeft:12, borderLeft:"2px solid #a855f722" }}>
      <div style={{ display:"flex", gap:8, marginBottom:10 }}>
        <input style={{...S.inp,flex:1,marginBottom:0}} placeholder="Section name…" value={name}
          onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} />
        <button style={S.btnP} onClick={add}>Add</button>
      </div>
      {(category.subcategories??[]).map(s => (
        <div key={s.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #ffffff06", fontSize:13 }}>
          <span style={{ color:"#f0ede8" }}>{s.name}</span>
          <button style={{ background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:13 }} onClick={()=>del(s.id)}>✕</button>
        </div>
      ))}
      {(category.subcategories??[]).length===0 && <div style={{ fontSize:12, color:"#6b6880" }}>No sections yet.</div>}
    </div>
  );
}

function UsersTab() {
  const [users,     setUsers]     = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => { getAllUsers().then(setUsers); getAllCompanies().then(setCompanies); }, []);

  const changeRole = async (id, role) => {
    await updateUserRole(id, role);
    setUsers(p => p.map(u => u.id===id?{...u,role}:u));
  };
  const assign = async (id, company_id) => {
    await assignUserToCompany(id, company_id||null, null);
    setUsers(p => p.map(u => u.id===id?{...u,company_id:company_id||null}:u));
  };

  return (
    <div>
      <div style={{...S.h3,marginBottom:14}}>All Users ({users.length})</div>
      {users.map(u => (
        <div key={u.id} style={S.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{u.full_name}</div>
              <div style={{ fontSize:11, color:"#6b6880" }}>{u.company?.name ?? "No company"}</div>
            </div>
            <span style={S.chip(u.role)}>{u.role}</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <div style={S.lbl}>Role</div>
              <select style={S.sel} value={u.role} onChange={e=>changeRole(u.id,e.target.value)}>
                <option value="vm">VM</option>
                <option value="manager">Manager</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <div style={S.lbl}>Company</div>
              <select style={S.sel} value={u.company_id??""} onChange={e=>assign(u.id,e.target.value)}>
                <option value="">— none —</option>
                {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [companies, setCompanies] = useState([]);
  const [selected,  setSelected]  = useState("");
  const [cfg,       setCfg]       = useState(null);

  useEffect(() => { getAllCompanies().then(setCompanies); }, []);
  useEffect(() => {
    if (!selected) { setCfg(null); return; }
    getAllCompanies().then(cs => { const c=cs.find(x=>x.id===selected); setCfg(c?.settings??null); });
  }, [selected]);

  const toggle = async (key) => {
    const next = { ...cfg, [key]: !cfg[key] };
    setCfg(next);
    await updateSettings(selected, { [key]: !cfg[key] });
  };

  const FEATURES = [
    ["enable_reports",       "📈 Reports"],
    ["enable_chat",          "💬 Chat"],
    ["enable_notifications", "🔔 Notifications"],
    ["enable_attachments",   "📎 Attachments"],
    ["enable_leaderboard",   "🏆 Leaderboard"],
    ["enable_guidelines",    "📖 Guidelines"],
  ];

  return (
    <div>
      <div style={S.card}>
        <div style={S.lbl}>Select Company</div>
        <select style={S.sel} value={selected} onChange={e=>setSelected(e.target.value)}>
          <option value="">— choose a company —</option>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {cfg && (
        <div style={S.card}>
          <div style={S.h3}>Feature Toggles</div>
          {FEATURES.map(([key, label]) => (
            <div key={key} style={S.row}>
              <span style={{ fontSize:14 }}>{label}</span>
              <button style={S.toggle(cfg[key])} onClick={()=>toggle(key)}>
                <div style={S.toggleDot(cfg[key])} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}