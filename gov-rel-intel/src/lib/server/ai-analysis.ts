import "server-only";

import { generateClientRelevance, generateSourceSummary } from "@/lib/ai";
import { runKeywordMatchingForSourceItem } from "@/lib/server/matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLIENT_RELEVANCE_PROMPT_VERSION } from "@/prompts/client-relevance";
import { SOURCE_SUMMARY_PROMPT_VERSION } from "@/prompts/source-summary";

const AI_RELEVANCE_THRESHOLD = 50;

export async function analyzeSourceItemWithAI(sourceItemId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: sourceItem, error: sourceError } = await supabase
    .from("source_items")
    .select("id, title, source_type, published_date, clean_text, raw_text, summary")
    .eq("id", sourceItemId)
    .single();

  if (sourceError) {
    throw sourceError;
  }

  await runKeywordMatchingForSourceItem(sourceItemId);

  const sourceText = sourceItem.clean_text || sourceItem.raw_text || "";
  if (sourceText.trim().length === 0) {
    return { sourceSummarySaved: false, relevanceRuns: 0, matchesUpserted: 0 };
  }

  const sourceSummary = await generateSourceSummary({
    title: sourceItem.title,
    sourceType: sourceItem.source_type,
    publishedDate: sourceItem.published_date,
    cleanText: sourceText,
  });

  await supabase
    .from("source_items")
    .update({
      summary: sourceSummary.result.summary,
      topic_tags: sourceSummary.result.topic_tags,
    })
    .eq("id", sourceItemId);

  await supabase.from("ai_outputs").insert({
    related_entity_type: "source_item",
    related_entity_id: sourceItemId,
    output_type: "source_summary",
    prompt_version: SOURCE_SUMMARY_PROMPT_VERSION,
    model: sourceSummary.model || null,
    input_snapshot: sourceSummary.inputSnapshot,
    output_json: sourceSummary.result,
    output_text: sourceSummary.rawText,
  });

  const [{ data: clients, error: clientsError }, { data: watchlists, error: watchlistError }, { data: existingMatches }] =
    await Promise.all([
      supabase.from("clients").select("id, name, description, industry").eq("active", true),
      supabase.from("client_watchlists").select("client_id, keyword"),
      supabase.from("client_matches").select("id, client_id, source_item_id").eq("source_item_id", sourceItemId),
    ]);

  if (clientsError) {
    throw clientsError;
  }
  if (watchlistError) {
    throw watchlistError;
  }

  const watchlistTermsByClient = new Map<string, string[]>();
  for (const item of watchlists ?? []) {
    const list = watchlistTermsByClient.get(item.client_id) ?? [];
    list.push(item.keyword);
    watchlistTermsByClient.set(item.client_id, list);
  }

  const existingMatchByClient = new Map<string, { id: string }>();
  for (const match of existingMatches ?? []) {
    existingMatchByClient.set(match.client_id, { id: match.id });
  }

  let relevanceRuns = 0;
  let matchesUpserted = 0;

  for (const client of clients ?? []) {
    const watchTerms = watchlistTermsByClient.get(client.id) ?? [];
    const relevance = await generateClientRelevance({
      clientName: client.name,
      clientDescription: client.description,
      clientIndustry: client.industry,
      watchlistTerms: watchTerms,
      sourceTitle: sourceItem.title,
      sourceType: sourceItem.source_type,
      sourceCleanText: sourceText,
    });

    relevanceRuns += 1;

    await supabase.from("ai_outputs").insert({
      related_entity_type: "source_item_client_relevance",
      related_entity_id: sourceItemId,
      output_type: "client_relevance",
      prompt_version: CLIENT_RELEVANCE_PROMPT_VERSION,
      model: relevance.model || null,
      input_snapshot: {
        client_id: client.id,
        ...relevance.inputSnapshot,
      },
      output_json: relevance.result,
      output_text: relevance.rawText,
    });

    const hasExistingMatch = existingMatchByClient.has(client.id);
    if (!hasExistingMatch && relevance.result.relevance_score < AI_RELEVANCE_THRESHOLD) {
      continue;
    }

    const { error: upsertError } = await supabase.from("client_matches").upsert(
      {
        client_id: client.id,
        source_item_id: sourceItemId,
        relevance_score: relevance.result.relevance_score,
        matched_keywords: relevance.result.matched_keywords,
        matched_themes: relevance.result.matched_themes,
        relevance_explanation: relevance.result.relevance_explanation,
        risk_level: relevance.result.risk_level,
        opportunity_level: relevance.result.opportunity_level,
        recommended_action: relevance.result.recommended_action,
        should_include_in_client_report: relevance.result.should_include_in_client_report,
      },
      { onConflict: "client_id,source_item_id" },
    );

    if (upsertError) {
      throw upsertError;
    }

    matchesUpserted += 1;
  }

  return { sourceSummarySaved: true, relevanceRuns, matchesUpserted };
}
