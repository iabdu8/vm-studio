import { supabase } from "../lib/supabase.js";

// ============================================================
//  ENTERPRISE SERVICE
//  Promotions + Campaign Progress
// ============================================================

// ── PROMOTIONS ────────────────────────────────────────────────
// العروض المنتهية تختفي تلقائياً (date_to >= اليوم)
export async function getPromotions(company_id) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("promotions")
    .select("*, target_branches:promotion_branches(branch_id), campaign:campaigns(id,name)")
    .eq("company_id", company_id)
    .gte("date_to", today)
    .order("date_from", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPromotion(payload, branchIds) {
  const { data: promo, error } = await supabase
    .from("promotions")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  if (branchIds?.length) {
    const { error: branchErr } = await supabase.from("promotion_branches")
      .insert(branchIds.map(b => ({ promotion_id: promo.id, branch_id: b })));
    if (branchErr) process.env?.NODE_ENV !== "production" && console.error(branchErr);
  }
  return promo;
}

export async function deletePromotion(id) {
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw error;
}

// ── CAMPAIGN PROGRESS ─────────────────────────────────────────
export async function getCampaignProgress(campaign_id) {
  const { data, error } = await supabase
    .from("campaign_branches")
    .select("branch_id, status, branch:branches(id,name)")
    .eq("campaign_id", campaign_id);
  if (error) throw error;
  return data ?? [];
}

// عند إنشاء حملة — كل الفروع تبدأ not_started
export async function initCampaignBranches(campaign_id, branchIds) {
  if (!branchIds?.length) return;
  const { error } = await supabase.from("campaign_branches")
    .upsert(
      branchIds.map(b => ({ campaign_id, branch_id: b, status: "not_started" })),
      { onConflict: "campaign_id,branch_id" }
    );
  if (error) throw error;
}

export async function setCampaignBranchStatus(campaign_id, branch_id, status) {
  const { error } = await supabase.from("campaign_branches")
    .upsert(
      { campaign_id, branch_id, status, updated_at: new Date().toISOString() },
      { onConflict: "campaign_id,branch_id" }
    );
  if (error) throw error;
}
function logNotifyError(error) {
  if (error) process.env?.NODE_ENV !== "production" && console.error(error);
}

export async function notifyAll(company_id, type, title, body) {
  const { data: users } = await supabase
    .from('profiles').select('id').eq('company_id', company_id);
  if (!users?.length) return;
  const { error } = await supabase.from('notifications').insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
  logNotifyError(error);
}

export async function notifyManagers(company_id, type, title, body) {
  const { data: users } = await supabase
    .from('profiles').select('id')
    .eq('company_id', company_id)
    .in('role', ['manager', 'area_manager', 'store_manager']);
  if (!users?.length) return;
  const { error } = await supabase.from('notifications').insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
  logNotifyError(error);
}

export async function notifyBranch(company_id, branch_id, type, title, body) {
  const { data: users } = await supabase
    .from('profiles').select('id')
    .eq('company_id', company_id).eq('branch_id', branch_id);
  if (!users?.length) return;
  const { error } = await supabase.from('notifications').insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
  logNotifyError(error);
}

export async function notifyUser(company_id, user_id, type, title, body) {
  const { error } = await supabase.from('notifications').insert({
    company_id, user_id, type, title, body
  });
  logNotifyError(error);
}

// ── CAMPAIGN ACKNOWLEDGEMENTS (Head VM sign-off, never blocking) ──
export async function getCampaignAcknowledgement(campaign_id) {
  const { data, error } = await supabase
    .from("campaign_acknowledgements")
    .select("*, acknowledger:acknowledged_by(full_name)")
    .eq("campaign_id", campaign_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function acknowledgeCampaign(campaign_id, head_vm_id) {
  const { data, error } = await supabase
    .from("campaign_acknowledgements")
    .upsert({ campaign_id, acknowledged_by: head_vm_id, acknowledged_at: new Date().toISOString() }, { onConflict: "campaign_id" })
    .select("*, acknowledger:acknowledged_by(full_name)")
    .single();
  if (error) throw error;
  return data;
}

// ── VM MANAGER BRANCH ASSIGNMENTS ──────────────────────────────
export async function getManagerBranches(manager_id) {
  const { data, error } = await supabase
    .from("manager_branches")
    .select("branch_id")
    .eq("manager_id", manager_id);
  if (error) throw error;
  return (data ?? []).map(r => r.branch_id);
}

export async function setManagerBranches(manager_id, branchIds) {
  await supabase.from("manager_branches").delete().eq("manager_id", manager_id);
  if (!branchIds?.length) return;
  const { error } = await supabase.from("manager_branches")
    .insert(branchIds.map(branch_id => ({ manager_id, branch_id })));
  if (error) throw error;
}

// ── SCOPED INVITES (area_manager / store_manager, super_admin only) ──
function genInviteCode() {
  return Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
}

export async function createInvite(company_id, role, branchIds, created_by) {
  const code = genInviteCode();
  const { data, error } = await supabase
    .from("invites")
    .insert({ company_id, role, code, branch_ids: branchIds, created_by })
    .select().single();
  if (error) throw error;
  return data;
}

export async function getInvites(company_id) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function redeemInvite(code) {
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .is("used_by", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markInviteUsed(invite_id, used_by) {
  const { error } = await supabase
    .from("invites")
    .update({ used_by, used_at: new Date().toISOString() })
    .eq("id", invite_id);
  if (error) throw error;
}
