import { requireSupabase, supabase } from "../lib/supabase.js";

export async function signIn(email, password) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await requireSupabase().auth.getSession();
  return session;
}

export async function loadSession() {
  const client = requireSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data: profile, error: pErr } = await client
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
  // Independent queries — run in parallel instead of one after another.
  const [{ data: settings }, { data: categories }, { data: branches }] = await Promise.all([
    client.from("company_settings").select("*").eq("company_id", profile.company_id).single(),
    client.from("categories").select("*, subcategories(*)")
      .eq("company_id", profile.company_id).eq("is_active", true).order("sort_order"),
    client.from("branches").select("*")
      .eq("company_id", profile.company_id).eq("is_active", true).order("sort_order"),
  ]);

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

// Supabase auto-signs the user in as soon as they click the "Confirm email"
// link (detectSessionInUrl picks up the tokens in the redirect URL). Product
// wants confirmation to just confirm the address — the user must still sign
// in manually afterwards.
export function isEmailConfirmationRedirect() {
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return /type=signup|type=email_change|type=invite/.test(hash) || /type=signup|type=email_change|type=invite/.test(search);
}

export function onAuthChange(callback) {
  if (!supabase) {
    callback(null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && isEmailConfirmationRedirect()) {
      window.history.replaceState(null, "", window.location.pathname);
      await supabase.auth.signOut();
      callback(null, { justConfirmed: true });
      return;
    }
    callback(session);
  });
}
