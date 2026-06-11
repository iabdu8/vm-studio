import { supabase } from "../lib/supabase.js";

// ============================================================
//  TASKS
// ============================================================
export async function getTasks(company_id) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, category:categories(name,icon), subcategory:subcategories(name)")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTask(payload) {
  const { data, error } = await supabase
    .from("tasks").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from("tasks").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
//  SUBMISSIONS
// ============================================================
export async function getSubmissions(company_id) {
  const { data, error } = await supabase
    .from("submissions")
    .select(`
      *,
      submitter:submitted_by(full_name, avatar_initials),
      reviewer:reviewed_by(full_name),
      branch:branches(name),
      category:categories(name, icon),
      subcategory:subcategories(name),
      photos:submission_photos(*)
    `)
    .eq("company_id", company_id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map(s => ({
    ...s,
    photos: (s.photos ?? []).map(p => ({
      ...p,
      url: supabase.storage.from("vm-photos").getPublicUrl(p.storage_path).data.publicUrl,
    })),
  }));
}

export async function createSubmission(payload, beforeFiles, afterFiles) {
  const { data: sub, error } = await supabase
    .from("submissions").insert(payload).select().single();
  if (error) throw error;

  const upload = async (file, type) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${payload.company_id}/${sub.id}/${type}-${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("vm-photos").upload(path, file);
    if (upErr) throw upErr;
    await supabase.from("submission_photos")
      .insert({ submission_id: sub.id, storage_path: path, photo_type: type });
  };

  await Promise.all([
    ...beforeFiles.map(f => upload(f.file ?? f, "before")),
    ...afterFiles .map(f => upload(f.file ?? f, "after")),
  ]);

  return sub;
}

export async function reviewSubmission(id, status, score, reviewer_id) {
  const { data, error } = await supabase
    .from("submissions")
    .update({ status, score, reviewed_by: reviewer_id, reviewed_at: new Date().toISOString() })
    .eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ============================================================
//  CHAT
// ============================================================
export async function getChatMessages(company_id, room) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*, sender:profiles(full_name, avatar_initials, role)")
    .eq("company_id", company_id)
    .eq("room", room)
    .order("created_at")
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(company_id, sender_id, room, body) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ company_id, sender_id, room, body })
    .select("*, sender:profiles(full_name, avatar_initials, role)")
    .single();
  if (error) throw error;
  return data;
}

export function subscribeToChat(company_id, room, onMessage) {
  return supabase
    .channel(`chat-${company_id}-${room}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "chat_messages",
      filter: `company_id=eq.${company_id}`,
    }, payload => {
      if (payload.new.room === room) onMessage(payload.new);
    })
    .subscribe();
}

// ============================================================
//  GUIDELINES
// ============================================================
export async function getGuidelines(company_id) {
  const { data, error } = await supabase
    .from("guidelines")
    .select("*")
    .eq("company_id", company_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(g => ({
    ...g,
    file_url: g.storage_path
      ? supabase.storage.from("vm-guidelines").getPublicUrl(g.storage_path).data.publicUrl
      : null,
  }));
}

export async function uploadGuideline(company_id, uploaded_by, title, category, file) {
  let storage_path = null;
  let file_type = "doc";

  if (file) {
    const safeFileName = Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    storage_path = `${company_id}/${safeFileName}`;
    const { error: upErr } = await supabase.storage
      .from("vm-guidelines").upload(storage_path, file);
    if (upErr) throw upErr;
    file_type = file.type.startsWith("image/") ? "img" : "pdf";
  }

  const { data, error } = await supabase
    .from("guidelines")
    .insert({ company_id, uploaded_by, title, category, storage_path, file_type })
    .select().single();
  if (error) throw error;
  return data;
}

// ============================================================
//  ACTIVITY LOG
// ============================================================
export async function logActivity(company_id, user_id, action, detail) {
  await supabase.from("activity_log")
    .insert({ company_id, user_id, action, detail });
}

export async function getActivityLog(company_id) {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*, user:profiles(full_name, role)")
    .eq("company_id", company_id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}