import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Slot = {
  start_time: string; // ISO
  end_time: string; // ISO
};

function toIsoFromLocal(dateStr: string, timeStr: string, tz: string) {
  // Implementação simples para o caso Brasil (sem DST):
  // Se o usuário escolher America/Sao_Paulo, assumimos -03:00.
  // (Se precisar suportar outros fusos no futuro, usamos uma lib/Temporal.)
  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const offset = tz === "America/Sao_Paulo" ? "-03:00" : "Z";
  const isoLike = offset === "Z" ? `${dateStr}T${cleanTime}Z` : `${dateStr}T${cleanTime}${offset}`;
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function scrapeCalendarAppSlots(url: string) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  // A página do calendar.app é altamente dinâmica; pedimos ao Firecrawl para
  // renderizar e extrair um JSON estruturado de horários disponíveis.
  const prompt = `Extract ALL available appointment slots from this Google Calendar booking page.
Return JSON strictly in this shape:
{
  "timezone": "America/Sao_Paulo",
  "slots": [
    { "date": "YYYY-MM-DD", "start": "HH:MM", "end": "HH:MM" }
  ]
}
Rules:
- Only include future slots (from today onward).
- If end is missing on the page, infer end as start + 60 minutes.
- Do not include booked/unavailable times.`;

  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      // Firecrawl v1: formats é array de strings. Extração estruturada vai em jsonOptions.
      formats: ["json"],
      jsonOptions: {
        prompt,
      },
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  const json = await resp.json();
  if (!resp.ok) {
    console.error("[sync-calendarapp-availability] Firecrawl error:", json);
    throw new Error(json?.error || `Firecrawl request failed (${resp.status})`);
  }

  // Firecrawl v1 normalmente retorna dentro de data.
  const extracted = json?.data?.json ?? json?.json;
  return extracted;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("[sync-calendarapp-availability] Auth error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const timezone = typeof body?.timezone === "string" ? body.timezone : "America/Sao_Paulo";

    if (!url || !url.startsWith("http")) {
      return new Response(JSON.stringify({ error: "Missing or invalid url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[sync-calendarapp-availability] Scraping:", { userId, url });
    const extracted = await scrapeCalendarAppSlots(url);

    const rawSlots: Array<{ date?: string; start?: string; end?: string }> =
      Array.isArray(extracted?.slots) ? extracted.slots : [];

    const normalized: Slot[] = rawSlots
      .map((s) => {
        const date = (s.date || "").trim();
        const start = (s.start || "").trim();
        const end = (s.end || "").trim();
        if (!date || !start) return null;

        const startIso = toIsoFromLocal(date, start, timezone);
        const endIso = end ? toIsoFromLocal(date, end, timezone) : null;
        if (!startIso) return null;

        const fallbackEnd = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
        return {
          start_time: startIso,
          end_time: endIso || fallbackEnd,
        };
      })
      .filter((x): x is Slot => Boolean(x))
      .filter((s) => {
        const st = new Date(s.start_time).getTime();
        const en = new Date(s.end_time).getTime();
        return Number.isFinite(st) && Number.isFinite(en) && en > st;
      })
      // remove duplicados
      .filter((s, idx, arr) => {
        const k = `${s.start_time}|${s.end_time}`;
        return arr.findIndex((x) => `${x.start_time}|${x.end_time}` === k) === idx;
      });

    const key = (s: { start_time: string; end_time: string }) => `${s.start_time}|${s.end_time}`;
    const desiredKeys = new Set(normalized.map(key));

    // Carrega slots futuros existentes desta fonte
    const { data: existing, error: existingError } = await supabase
      .from("calendar_availability")
      .select("id, start_time, end_time, is_booked")
      .eq("user_id", userId)
      .eq("calendar_id", "calendarapp")
      .gte("start_time", new Date().toISOString());

    if (existingError) throw existingError;
    const existingRows = (existing || []).map((r: any) => ({
      id: r.id as string,
      start_time: r.start_time as string,
      end_time: r.end_time as string,
      is_booked: Boolean(r.is_booked),
    }));
    const existingKeys = new Set(existingRows.map((r) => key(r)));

    const toInsert = normalized
      .filter((s) => !existingKeys.has(key(s)))
      .map((s) => ({
        user_id: userId,
        calendar_id: "calendarapp",
        start_time: s.start_time,
        end_time: s.end_time,
        is_booked: false,
      }));

    const toDeleteIds = existingRows
      .filter((r) => !r.is_booked)
      .filter((r) => !desiredKeys.has(key(r)))
      .map((r) => r.id);

    let inserted = 0;
    let deleted = 0;

    if (toInsert.length) {
      const { error: insertError } = await supabase.from("calendar_availability").insert(toInsert);
      if (insertError) throw insertError;
      inserted = toInsert.length;
    }

    if (toDeleteIds.length) {
      const { error: deleteError } = await supabase.from("calendar_availability").delete().in("id", toDeleteIds);
      if (deleteError) throw deleteError;
      deleted = toDeleteIds.length;
    }

    console.log("[sync-calendarapp-availability] Done:", { inserted, deleted, total: normalized.length });

    return new Response(
      JSON.stringify({ success: true, inserted, deleted, total: normalized.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("[sync-calendarapp-availability] Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
