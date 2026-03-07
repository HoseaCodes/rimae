// Supabase Edge Function — VCTRL ChatGPT Ingest Pipeline
// Deploy: supabase functions deploy ingest-chatgpt
// Secrets: supabase secrets set CHATGPT_INGEST_TOKEN=<your-token>

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VCTRL_PROJECT_ID = "a1b2c3d4-0000-0000-0000-000000000001";

interface IngestPayload {
  title: string;
  raw_text: string;
  summary?: string;
  event_type?: string;
  category?: string;
  severity?: string;
  source_url?: string;
  source_name?: string;
  tags?: string[];
  event_timestamp?: string;
}

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }
  if (req.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  // Auth check — accepts x-ingest-token header or Authorization: Bearer <token>
  const xToken = req.headers.get("x-ingest-token");
  const authHeader = req.headers.get("Authorization");
  const bearerToken = authHeader ? authHeader.replace("Bearer ", "") : "";
  const token = xToken || bearerToken;
  const expectedToken = Deno.env.get("CHATGPT_INGEST_TOKEN");
  if (!expectedToken || token !== expectedToken) {
    return respond({ error: "Unauthorized", hint: "Check x-ingest-token header and CHATGPT_INGEST_TOKEN secret" }, 401);
  }

  // Parse body
  let body: IngestPayload;
  try {
    body = await req.json();
  } catch {
    return respond({ error: "Invalid JSON" }, 400);
  }

  if (!body.title?.trim() || !body.raw_text?.trim()) {
    return respond({ error: "title and raw_text are required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create source
  let sourceId: string | null = null;
  if (body.source_url || body.source_name) {
    const { data: source } = await (supabase as any)
      .from("sources")
      .insert({
        project_id: VCTRL_PROJECT_ID,
        name: body.source_name ?? "ChatGPT",
        type: "chatgpt_web",
        original_url: body.source_url ?? null,
      })
      .select("id")
      .single();
    sourceId = source?.id ?? null;
  }

  // Validate and clamp enum values
  const VALID_EVENT_TYPES = new Set(["decision","bug_note","feedback","insight","blocker","update","reference","log"]);
  const VALID_CATEGORIES = new Set(["product_decision","bug","auth_oauth","launch_blocker","beta_feedback","competitor_insight","pricing","roadmap","app_store","marketing","chat_log","general"]);
  const VALID_SEVERITIES = new Set(["critical","high","medium","low","info"]);

  const eventType = VALID_EVENT_TYPES.has(body.event_type ?? "") ? body.event_type! : "log";
  const category = VALID_CATEGORIES.has(body.category ?? "") ? body.category! : "chat_log";
  const severity = VALID_SEVERITIES.has(body.severity ?? "") ? body.severity! : "info";

  // Insert event
  const { data: event, error: eventError } = await (supabase as any)
    .from("events")
    .insert({
      project_id: VCTRL_PROJECT_ID,
      source_id: sourceId,
      title: body.title.slice(0, 500),
      summary: body.summary?.slice(0, 2000) ?? null,
      raw_text: body.raw_text,
      event_type: eventType,
      category,
      severity,
      status: "open",
      event_timestamp: body.event_timestamp ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return respond({ error: eventError?.message ?? "Insert failed" }, 500);
  }

  // Apply tags
  const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : ["chatgpt"];
  for (const tagName of tags) {
    const slug = slugify(tagName);
    if (!slug) continue;
    const { data: tag } = await (supabase as any)
      .from("tags")
      .upsert({ name: tagName, slug }, { onConflict: "slug" })
      .select("id")
      .single();
    if (tag?.id) {
      await (supabase as any)
        .from("event_tags")
        .upsert({ event_id: event.id, tag_id: tag.id }, { onConflict: "event_id,tag_id" });
    }
  }

  return respond({ success: true, eventId: event.id });
});
