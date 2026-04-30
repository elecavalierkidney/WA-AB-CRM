"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { generateClientUpdate, generateMeetingRequest } from "@/lib/ai";
import { analyzeSourceItemWithAI } from "@/lib/server/ai-analysis";
import { runKeywordMatchingForSourceItem } from "@/lib/server/matching";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLIENT_UPDATE_PROMPT_VERSION } from "@/prompts/client-update";
import { MEETING_REQUEST_PROMPT_VERSION } from "@/prompts/meeting-request";

const sourceSchema = z.object({
  title: z.string().trim().min(3).max(400),
  sourceType: z.string().trim().min(2).max(120),
  sourceName: z.string().trim().max(200).optional(),
  url: z.string().trim().url().max(1200).optional(),
  publishedDate: z.string().optional(),
  rawText: z.string().trim().min(10),
  cleanText: z.string().trim().optional(),
  ministry: z.string().trim().max(200).optional(),
});

const matchStatusSchema = z.enum([
  "New",
  "Reviewed",
  "Relevant",
  "Not relevant",
  "Action required",
  "Added to report",
  "Archived",
]);

const intelligenceTaskSchema = z.object({
  sourceItemId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  stakeholderId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(4000).optional(),
  owner: z.string().trim().max(120).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
});

const stakeholderLinkSchema = z.object({
  sourceItemId: z.string().uuid(),
  stakeholderId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  summary: z.string().trim().max(4000).optional(),
});

const addToReportSchema = z.object({
  sourceItemId: z.string().uuid(),
  clientMatchId: z.string().uuid(),
  clientId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
});

const meetingRequestSchema = z.object({
  sourceItemId: z.string().uuid(),
  clientMatchId: z.string().uuid(),
  stakeholderId: z.string().uuid(),
  purpose: z.string().trim().min(6).max(1000),
  ask: z.string().trim().min(6).max(1000),
  meetingLength: z.string().trim().min(2).max(120),
});

const clientUpdateSchema = z.object({
  sourceItemId: z.string().uuid(),
  clientMatchId: z.string().uuid(),
});

function buildCleanText(rawText: string, cleanText?: string) {
  if (cleanText && cleanText.length > 0) {
    return cleanText;
  }

  return rawText.replace(/\s+/g, " ").trim();
}

function readClientName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string } | undefined)?.name;
  }
  return (relation as { name?: string } | null)?.name;
}

export async function createSourceItemAction(formData: FormData) {
  const parsed = sourceSchema.safeParse({
    title: formData.get("title"),
    sourceType: formData.get("sourceType"),
    sourceName: formData.get("sourceName"),
    url: formData.get("url") || undefined,
    publishedDate: formData.get("publishedDate"),
    rawText: formData.get("rawText"),
    cleanText: formData.get("cleanText"),
    ministry: formData.get("ministry"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const cleanText = buildCleanText(parsed.data.rawText, parsed.data.cleanText);

  const { data: created, error } = await supabase
    .from("source_items")
    .insert({
      title: parsed.data.title,
      source_type: parsed.data.sourceType,
      source_name: parsed.data.sourceName || null,
      url: parsed.data.url || null,
      published_date: parsed.data.publishedDate || null,
      raw_text: parsed.data.rawText,
      clean_text: cleanText,
      ministry: parsed.data.ministry || null,
    })
    .select("id")
    .single();

  let sourceItemId = created?.id;

  if (error) {
    if (error.code === "23505" && parsed.data.url) {
      const { data: existing } = await supabase
        .from("source_items")
        .select("id")
        .eq("url", parsed.data.url)
        .single();
      sourceItemId = existing?.id;
    } else {
      throw error;
    }
  }

  if (sourceItemId) {
    try {
      await analyzeSourceItemWithAI(sourceItemId);
    } catch {
      // Fallback to deterministic matching so ingestion still succeeds if AI is unavailable.
      await runKeywordMatchingForSourceItem(sourceItemId);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/intelligence");
}

export async function rerunMatchingAction(formData: FormData) {
  const sourceItemId = z.string().uuid().safeParse(formData.get("sourceItemId"));
  if (!sourceItemId.success) {
    return;
  }

  try {
    await analyzeSourceItemWithAI(sourceItemId.data);
  } catch {
    await runKeywordMatchingForSourceItem(sourceItemId.data);
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/intelligence");
  revalidatePath(`/intelligence/${sourceItemId.data}`);
}

export async function updateClientMatchStatusAction(formData: FormData) {
  const matchId = z.string().uuid().safeParse(formData.get("matchId"));
  const status = matchStatusSchema.safeParse(formData.get("status"));
  const sourceItemId = z.string().uuid().optional().safeParse(formData.get("sourceItemId"));

  if (!matchId.success || !status.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("client_matches").update({ status: status.data }).eq("id", matchId.data);
  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/intelligence");

  if (sourceItemId.success && sourceItemId.data) {
    revalidatePath(`/intelligence/${sourceItemId.data}`);
  }
}

export async function createTaskFromIntelligenceAction(formData: FormData) {
  const parsed = intelligenceTaskSchema.safeParse({
    sourceItemId: formData.get("sourceItemId"),
    clientId: formData.get("clientId") || undefined,
    stakeholderId: formData.get("stakeholderId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    owner: formData.get("owner"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority") || "Medium",
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("tasks").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    source_item_id: parsed.data.sourceItemId,
    client_id: parsed.data.clientId || null,
    stakeholder_id: parsed.data.stakeholderId || null,
    owner: parsed.data.owner || null,
    due_date: parsed.data.dueDate || null,
    priority: parsed.data.priority,
    status: "Not started",
  });

  if (error) {
    throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/intelligence");
  revalidatePath(`/intelligence/${parsed.data.sourceItemId}`);
}

export async function linkStakeholderToIntelligenceAction(formData: FormData) {
  const parsed = stakeholderLinkSchema.safeParse({
    sourceItemId: formData.get("sourceItemId"),
    stakeholderId: formData.get("stakeholderId"),
    clientId: formData.get("clientId") || undefined,
    summary: formData.get("summary"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("interactions").insert({
    stakeholder_id: parsed.data.stakeholderId,
    client_id: parsed.data.clientId || null,
    source_item_id: parsed.data.sourceItemId,
    interaction_type: "Internal note",
    interaction_date: today,
    summary:
      parsed.data.summary || "Linked stakeholder to intelligence item for follow-up tracking.",
    follow_up_required: false,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/stakeholders");
  revalidatePath("/intelligence");
  revalidatePath(`/intelligence/${parsed.data.sourceItemId}`);
}

export async function addClientMatchToReportAction(formData: FormData) {
  const parsed = addToReportSchema.safeParse({
    sourceItemId: formData.get("sourceItemId"),
    clientMatchId: formData.get("clientMatchId"),
    clientId: formData.get("clientId"),
    reportId: formData.get("reportId") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  let reportId = parsed.data.reportId;

  if (!reportId) {
    const [{ data: client }, { data: existingDraft }] = await Promise.all([
      supabase.from("clients").select("name").eq("id", parsed.data.clientId).single(),
      supabase
        .from("reports")
        .select("id")
        .eq("client_id", parsed.data.clientId)
        .eq("status", "Draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (existingDraft?.id) {
      reportId = existingDraft.id;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const { data: created, error: reportError } = await supabase
        .from("reports")
        .insert({
          client_id: parsed.data.clientId,
          title: `Weekly Monitoring Report - ${client?.name ?? "Client"} - ${today}`,
          report_type: "Weekly Monitoring",
          start_date: today,
          end_date: today,
          status: "Draft",
        })
        .select("id")
        .single();

      if (reportError) {
        throw reportError;
      }
      reportId = created.id;
    }
  }

  const { data: existingItem } = await supabase
    .from("report_items")
    .select("id")
    .eq("report_id", reportId)
    .eq("client_match_id", parsed.data.clientMatchId)
    .maybeSingle();

  if (!existingItem) {
    const { error: itemError } = await supabase.from("report_items").insert({
      report_id: reportId,
      source_item_id: parsed.data.sourceItemId,
      client_match_id: parsed.data.clientMatchId,
    });
    if (itemError) {
      throw itemError;
    }
  }

  await supabase.from("client_matches").update({ status: "Added to report" }).eq("id", parsed.data.clientMatchId);

  revalidatePath("/intelligence");
  revalidatePath(`/intelligence/${parsed.data.sourceItemId}`);
  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
}

export async function generateMeetingRequestFromIntelligenceAction(formData: FormData) {
  const parsed = meetingRequestSchema.safeParse({
    sourceItemId: formData.get("sourceItemId"),
    clientMatchId: formData.get("clientMatchId"),
    stakeholderId: formData.get("stakeholderId"),
    purpose: formData.get("purpose"),
    ask: formData.get("ask"),
    meetingLength: formData.get("meetingLength"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: match }, { data: stakeholder }, { data: sourceItem }] = await Promise.all([
    supabase
      .from("client_matches")
      .select("id, client_id, relevance_explanation, clients(name)")
      .eq("id", parsed.data.clientMatchId)
      .single(),
    supabase
      .from("stakeholders")
      .select("full_name, title, organization")
      .eq("id", parsed.data.stakeholderId)
      .single(),
    supabase
      .from("source_items")
      .select("summary, title")
      .eq("id", parsed.data.sourceItemId)
      .single(),
  ]);

  const clientName = readClientName(match?.clients) || "Client";

  const draft = await generateMeetingRequest({
    clientName,
    stakeholderName: stakeholder?.full_name || "Stakeholder",
    stakeholderTitle: stakeholder?.title || null,
    stakeholderOrganization: stakeholder?.organization || null,
    purpose: parsed.data.purpose,
    sourceItemSummary: sourceItem?.summary || sourceItem?.title || "No summary available.",
    clientRelevanceExplanation:
      match?.relevance_explanation || "Relevance explanation not available.",
    desiredAsk: parsed.data.ask,
    meetingLength: parsed.data.meetingLength,
  });

  await supabase.from("ai_outputs").insert({
    related_entity_type: "client_match",
    related_entity_id: parsed.data.clientMatchId,
    output_type: "meeting_request_draft",
    prompt_version: MEETING_REQUEST_PROMPT_VERSION,
    model: draft.model || null,
    input_snapshot: draft.inputSnapshot,
    output_json: draft.result,
    output_text: draft.rawText,
  });

  revalidatePath(`/intelligence/${parsed.data.sourceItemId}`);
}

export async function generateClientUpdateFromIntelligenceAction(formData: FormData) {
  const parsed = clientUpdateSchema.safeParse({
    sourceItemId: formData.get("sourceItemId"),
    clientMatchId: formData.get("clientMatchId"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: match }, { data: sourceItem }] = await Promise.all([
    supabase
      .from("client_matches")
      .select(
        "id, relevance_explanation, recommended_action, clients(name), source_items(title, source_type, summary)",
      )
      .eq("id", parsed.data.clientMatchId)
      .single(),
    supabase.from("source_items").select("title, source_type, summary").eq("id", parsed.data.sourceItemId).single(),
  ]);

  const sourceFromMatch = Array.isArray(match?.source_items) ? match?.source_items[0] : match?.source_items;
  const clientName = readClientName(match?.clients) || "Client";

  const draft = await generateClientUpdate({
    clientName,
    sourceTitle: sourceFromMatch?.title || sourceItem?.title || "Untitled source",
    sourceType: sourceFromMatch?.source_type || sourceItem?.source_type || "Unknown source type",
    sourceSummary: sourceFromMatch?.summary || sourceItem?.summary || "No summary available.",
    relevanceExplanation: match?.relevance_explanation || "Relevance explanation not available.",
    recommendedAction:
      match?.recommended_action ||
      "Review the intelligence item and determine the appropriate stakeholder follow-up.",
  });

  await supabase.from("ai_outputs").insert({
    related_entity_type: "client_match",
    related_entity_id: parsed.data.clientMatchId,
    output_type: "client_update_draft",
    prompt_version: CLIENT_UPDATE_PROMPT_VERSION,
    model: draft.model || null,
    input_snapshot: draft.inputSnapshot,
    output_json: draft.result,
    output_text: draft.rawText,
  });

  revalidatePath(`/intelligence/${parsed.data.sourceItemId}`);
}
