// ============================================================
//  SEND-PUSH — sends a Web Push notification to one or more
//  users' subscribed devices, using VAPID keys stored as
//  function secrets. Called from the client right after a
//  `notifications` row is inserted (fire-and-forget).
//
//  Body: { user_ids: string[], title: string, body: string, url?: string }
//
//  Cleans up subscriptions the push service reports as gone
//  (410/404) so push_subscriptions doesn't accumulate dead rows.
// ============================================================
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@example.com";
    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500, headers: corsHeaders });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!anonKey) {
      return new Response(JSON.stringify({ error: "Anon key not configured" }), { status: 500, headers: corsHeaders });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    const { user_ids, title, body, url } = await req.json();
    const uniqueUserIds = [...new Set(Array.isArray(user_ids) ? user_ids : [])]
      .filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));

    if (!uniqueUserIds.length || uniqueUserIds.length > 100 || typeof title !== "string" || !title.trim()) {
      return new Response(JSON.stringify({ error: "Valid user_ids and title are required" }), { status: 400, headers: corsHeaders });
    }
    if (title.length > 120 || (typeof body === "string" && body.length > 500) || (typeof url === "string" && url.length > 300)) {
      return new Response(JSON.stringify({ error: "Payload too large" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: caller, error: callerError } = await supabase
      .from("profiles")
      .select("id, company_id, role, branch_id, is_active")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (callerError) throw callerError;
    if (!caller?.company_id || caller.is_active === false) {
      return new Response(JSON.stringify({ error: "Caller profile is not active" }), { status: 403, headers: corsHeaders });
    }

    const { data: targetUsers, error: targetError } = await supabase
      .from("profiles")
      .select("id, company_id, branch_id")
      .eq("company_id", caller.company_id)
      .in("id", uniqueUserIds);
    if (targetError) throw targetError;

    let managedBranchIds = new Set<string>();
    if (caller.role === "area_manager") {
      const { data: managedBranches, error: branchError } = await supabase
        .from("manager_branches")
        .select("branch_id")
        .eq("manager_id", caller.id);
      if (branchError) throw branchError;
      managedBranchIds = new Set((managedBranches ?? []).map((row) => row.branch_id));
    }

    const canNotify = (target: { id: string; branch_id: string | null }) => {
      if (target.id === caller.id) return true;
      if (caller.role === "manager" || caller.role === "super_admin") return true;
      if (caller.role === "area_manager") return !!target.branch_id && managedBranchIds.has(target.branch_id);
      if (caller.role === "store_manager") return !!caller.branch_id && target.branch_id === caller.branch_id;
      return false;
    };

    const allowedIds = new Set((targetUsers ?? []).filter(canNotify).map((u) => u.id));
    if (!allowedIds.size) {
      return new Response(JSON.stringify({ error: "No permitted notification targets" }), { status: 403, headers: corsHeaders });
    }

    const permittedIds = uniqueUserIds.filter((id) => allowedIds.has(id));

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, subscription")
      .in("user_id", permittedIds);
    if (error) throw error;
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });

    const payload = JSON.stringify({
      title: title.trim(),
      body: typeof body === "string" ? body.trim() : "",
      data: { url: typeof url === "string" && url.startsWith("/") ? url : "/" },
    });
    const staleIds: string[] = [];
    let sent = 0;

    await Promise.all(subs.map(async (row) => {
      try {
        const sub = typeof row.subscription === "string" ? JSON.parse(row.subscription) : row.subscription;
        await webpush.sendNotification(sub, payload);
        sent++;
      } catch (e) {
        if (e?.statusCode === 404 || e?.statusCode === 410) staleIds.push(row.id);
      }
    }));

    if (staleIds.length) await supabase.from("push_subscriptions").delete().in("id", staleIds);

    return new Response(JSON.stringify({ sent, removed: staleIds.length }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
