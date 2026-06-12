import { supabase } from "../lib/supabase.js";

// ── PROMOTIONS ────────────────────────────────────────────────
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
    .from("promotions").insert(payload).select().single();
  if (error) throw error;
  if (branchIds?.length) {
    await supabase.from("promotion_branches")
      .insert(branchIds.map(b => ({ promotion_id: promo.id, branch_id: b })));
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

// ── NOTIFICATIONS ─────────────────────────────────────────────
export async function sendNotification(sb, { company_id, user_id, type, title, body }) {
  await sb.from("notifications").insert({ company_id, user_id, type, title, body });
}

export async function notifyAll(sb, company_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id").eq("company_id", company_id);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}

export async function notifyManagers(sb, company_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id")
    .eq("company_id", company_id)
    .in("role", ["manager", "area_manager", "store_manager"]);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}

export async function notifyBranch(sb, company_id, branch_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id")
    .eq("company_id", company_id).eq("branch_id", branch_id);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}
export async function notifyAll(sb, company_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id").eq("company_id", company_id);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}

export async function notifyManagers(sb, company_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id")
    .eq("company_id", company_id)
    .in("role", ["manager", "area_manager", "store_manager"]);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}

export async function notifyBranch(sb, company_id, branch_id, type, title, body) {
  const { data: users } = await sb
    .from("profiles").select("id")
    .eq("company_id", company_id).eq("branch_id", branch_id);
  if (!users?.length) return;
  await sb.from("notifications").insert(
    users.map(u => ({ company_id, user_id: u.id, type, title, body }))
  );
}