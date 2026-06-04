import { supabase } from "../lib/supabase.js";

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function loadSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("*, company:companies(*), branch:branches(*)")
    .eq("id", user.id)
    .single();

  if (pErr) throw pErr;

  // ── Super admin with no company → return immediately, no need to load company data
  if (profile.role === "super_admin" && !profile.company_id) {
    return {
      profile,
      company:    null,
      settings:   null,
      categories: [],
      branches:   [],
    };
  }

  // ── Regular user or super_admin with company ──
  const { data: settings } = await supabase
    .from("company_settings")
    .select("*")
    .eq("company_id", profile.company_id)
    .single();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("sort_order");

  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .eq("company_id", profile.company_id)
    .eq("is_active", true)
    .order("sort_order");

  return {
    profile,
    company:    profile.company,
    settings:   settings ?? defaultSettings(profile.company_id),
    categories: categories ?? [],
    branches:   branches  ?? [],
  };
}

function defaultSettings(company_id) {
  return {
    company_id,
    enable_reports:       true,
    enable_chat:          true,
    enable_notifications: true,
    enable_attachments:   true,
    enable_leaderboard:   true,
    enable_guidelines:    true,
    max_photo_upload:     10,
  };
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}