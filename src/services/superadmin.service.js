import { supabase } from "../lib/supabase.js";

// ── Companies ─────────────────────────────────────────────────
export async function getAllCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("*, settings:company_settings(*)")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createCompany(payload) {
  const { data, error } = await supabase
    .from("companies").insert(payload).select().single();
  if (error) throw error;
  // auto-create settings row
  await supabase.from("company_settings").insert({ company_id: data.id });
  return data;
}

export async function updateCompany(id, updates) {
  const { data, error } = await supabase
    .from("companies").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCompany(id) {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// ── Feature Toggles ───────────────────────────────────────────
export async function updateSettings(company_id, updates) {
  const { data, error } = await supabase
    .from("company_settings")
    .update(updates)
    .eq("company_id", company_id)
    .select().single();
  if (error) throw error;
  return data;
}

// ── Categories ────────────────────────────────────────────────
export async function getCategoriesForCompany(company_id) {
  const { data, error } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .eq("company_id", company_id)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function adminCreateCategory(payload) {
  const { data, error } = await supabase
    .from("categories").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function adminUpdateCategory(id, updates) {
  const { data, error } = await supabase
    .from("categories").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function adminDeleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ── Users ─────────────────────────────────────────────────────
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, company:companies(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(id, role) {
  const { data, error } = await supabase
    .from("profiles").update({ role }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function assignUserToCompany(user_id, company_id, branch_id) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ company_id, branch_id })
    .eq("id", user_id).select().single();
  if (error) throw error;
  return data;
}
