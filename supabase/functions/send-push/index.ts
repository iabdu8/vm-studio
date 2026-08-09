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
    const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@example.com";
    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 500, headers: corsHeaders });
    }
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const { user_ids, title, body, url } = await req.json();
    if (!Array.isArray(user_ids) || !user_ids.length || !title) {
      return new Response(JSON.stringify({ error: "user_ids and title are required" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, subscription")
      .in("user_id", user_ids);
    if (error) throw error;
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });

    const payload = JSON.stringify({ title, body: body ?? "", data: { url: url ?? "/" } });
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
