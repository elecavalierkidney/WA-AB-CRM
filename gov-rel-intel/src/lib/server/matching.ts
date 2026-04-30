import "server-only";

import { computeKeywordMatch } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function runKeywordMatchingForSourceItem(sourceItemId: string) {
  const supabase = createSupabaseAdminClient();

  const [{ data: sourceItem, error: sourceError }, { data: activeClients, error: clientsError }] = await Promise.all([
    supabase
      .from("source_items")
      .select("id, title, clean_text, raw_text")
      .eq("id", sourceItemId)
      .single(),
    supabase.from("clients").select("id, name, active").eq("active", true),
  ]);

  if (sourceError) {
    throw sourceError;
  }

  if (clientsError) {
    throw clientsError;
  }

  const clients = activeClients ?? [];
  if (clients.length === 0) {
    return { created: 0, updated: 0, skipped: 0 };
  }

  const clientIds = clients.map((client) => client.id);
  const [{ data: watchlists, error: watchlistError }, { data: existingMatches, error: matchesError }] =
    await Promise.all([
      supabase
        .from("client_watchlists")
        .select("id, client_id, keyword, category, weight")
        .in("client_id", clientIds),
      supabase
        .from("client_matches")
        .select("id, client_id, status")
        .eq("source_item_id", sourceItemId),
    ]);

  if (watchlistError) {
    throw watchlistError;
  }
  if (matchesError) {
    throw matchesError;
  }

  const sourceText = `${sourceItem.title}\n${sourceItem.clean_text || sourceItem.raw_text || ""}`;
  const watchlistsByClient = new Map<string, { keyword: string; category: string | null; weight: number }[]>();
  for (const item of watchlists ?? []) {
    const list = watchlistsByClient.get(item.client_id) ?? [];
    list.push({
      keyword: item.keyword,
      category: item.category,
      weight: item.weight,
    });
    watchlistsByClient.set(item.client_id, list);
  }

  const existingByClient = new Map<string, { id: string; status: string }>();
  for (const record of existingMatches ?? []) {
    existingByClient.set(record.client_id, { id: record.id, status: record.status });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const client of clients) {
    const watchTerms = watchlistsByClient.get(client.id) ?? [];
    if (watchTerms.length === 0) {
      skipped += 1;
      continue;
    }

    const matchResult = computeKeywordMatch(sourceText, client.name, watchTerms);
    if (!matchResult) {
      skipped += 1;
      continue;
    }

    const existing = existingByClient.get(client.id);
    if (existing) {
      const { error } = await supabase
        .from("client_matches")
        .update({
          matched_keywords: matchResult.matchedKeywords,
          matched_themes: matchResult.matchedThemes,
          relevance_score: matchResult.relevanceScore,
          relevance_explanation: matchResult.relevanceExplanation,
          recommended_action:
            "Review this development and decide whether stakeholder outreach or a client update is required.",
          risk_level: null,
          opportunity_level: null,
          should_include_in_client_report: matchResult.relevanceScore >= 70,
        })
        .eq("id", existing.id);

      if (error) {
        throw error;
      }
      updated += 1;
      continue;
    }

    const { error } = await supabase.from("client_matches").insert({
      client_id: client.id,
      source_item_id: sourceItemId,
      matched_keywords: matchResult.matchedKeywords,
      matched_themes: matchResult.matchedThemes,
      relevance_score: matchResult.relevanceScore,
      relevance_explanation: matchResult.relevanceExplanation,
      recommended_action:
        "Review this development and decide whether stakeholder outreach or a client update is required.",
      risk_level: null,
      opportunity_level: null,
      should_include_in_client_report: matchResult.relevanceScore >= 70,
      status: "New",
    });

    if (error) {
      throw error;
    }
    created += 1;
  }

  return { created, updated, skipped };
}
