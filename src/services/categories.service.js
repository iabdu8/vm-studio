import { supabase } from "../lib/supabase.js";

export async function getCategories(company_id) {
  const { data, error } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .eq("company_id", company_id)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function createCategory(payload) {
  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// ── Subcategories ────────────────────────────────────────────
export async function createSubcategory(payload) {
  const { data, error } = await supabase
    .from("subcategories")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubcategory(id) {
  const { error } = await supabase.from("subcategories").delete().eq("id", id);
  if (error) throw error;
}
