"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const reportSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().trim().min(4).max(240),
  reportType: z.string().trim().min(3).max(120),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const reportUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(4).max(240),
  reportType: z.string().trim().min(3).max(120),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["Draft", "In review", "Final"]),
  body: z.string().trim().max(40000).optional(),
});

const reportItemSchema = z.object({
  reportId: z.string().uuid(),
  sourceItemId: z.string().uuid().optional(),
  clientMatchId: z.string().uuid().optional(),
  customSummary: z.string().trim().max(8000).optional(),
});

export async function createReportAction(formData: FormData) {
  const parsed = reportSchema.safeParse({
    clientId: formData.get("clientId") || undefined,
    title: formData.get("title"),
    reportType: formData.get("reportType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("reports").insert({
    client_id: parsed.data.clientId || null,
    title: parsed.data.title,
    report_type: parsed.data.reportType,
    start_date: parsed.data.startDate || null,
    end_date: parsed.data.endDate || null,
    status: "Draft",
  });

  if (error) {
    throw error;
  }

  revalidatePath("/reports");
}

export async function updateReportAction(formData: FormData) {
  const parsed = reportUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    reportType: formData.get("reportType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    status: formData.get("status") || "Draft",
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("reports")
    .update({
      title: parsed.data.title,
      report_type: parsed.data.reportType,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      status: parsed.data.status,
      body: parsed.data.body || null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    throw error;
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${parsed.data.id}`);
}

export async function addReportItemAction(formData: FormData) {
  const parsed = reportItemSchema.safeParse({
    reportId: formData.get("reportId"),
    sourceItemId: formData.get("sourceItemId") || undefined,
    clientMatchId: formData.get("clientMatchId") || undefined,
    customSummary: formData.get("customSummary"),
  });

  if (!parsed.success || (!parsed.data.sourceItemId && !parsed.data.clientMatchId)) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  let existing: { id: string } | null = null;
  if (parsed.data.clientMatchId) {
    const existingResult = await supabase
      .from("report_items")
      .select("id")
      .eq("report_id", parsed.data.reportId)
      .eq("client_match_id", parsed.data.clientMatchId)
      .maybeSingle();
    existing = existingResult.data;
  }

  if (!existing) {
    const { error } = await supabase.from("report_items").insert({
      report_id: parsed.data.reportId,
      source_item_id: parsed.data.sourceItemId || null,
      client_match_id: parsed.data.clientMatchId || null,
      custom_summary: parsed.data.customSummary || null,
    });

    if (error) {
      throw error;
    }
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${parsed.data.reportId}`);
}

export async function removeReportItemAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const reportId = z.string().uuid().safeParse(formData.get("reportId"));
  if (!id.success || !reportId.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("report_items").delete().eq("id", id.data);
  if (error) {
    throw error;
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId.data}`);
}
