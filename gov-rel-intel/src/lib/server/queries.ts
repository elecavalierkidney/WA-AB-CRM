import "server-only";

import { endOfWeek, formatISO, startOfDay } from "date-fns";

import { OPEN_TASK_STATUSES } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type WatchlistRow = Database["public"]["Tables"]["client_watchlists"]["Row"];
type SourceItemRow = Database["public"]["Tables"]["source_items"]["Row"];
type StakeholderRow = Database["public"]["Tables"]["stakeholders"]["Row"];
type ReportRow = Database["public"]["Tables"]["reports"]["Row"];

export interface IntelligenceFilters {
  clientId?: string;
  sourceType?: string;
  status?: string;
  minScore?: number;
  maxScore?: number;
  topic?: string;
  dateFrom?: string;
  dateTo?: string;
  actionRequiredOnly?: boolean;
  query?: string;
}

export interface StakeholderFilters {
  query?: string;
  stakeholderType?: string;
  ministry?: string;
  organization?: string;
  relationshipStrength?: string;
  strategicValue?: string;
  clientId?: string;
  followUpDue?: boolean;
  active?: "active" | "inactive" | "all";
}

export interface TaskFilters {
  query?: string;
  clientId?: string;
  stakeholderId?: string;
  sourceItemId?: string;
  owner?: string;
  priority?: string;
  status?: string;
  due?: "overdue" | "week" | "unscheduled";
}

export async function getDashboardStats() {
  const supabase = createSupabaseAdminClient();

  const [clientsResult, openTasksResult, highRelevanceResult, newIntelResult, dueThisWeekResult] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("active", true),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", [...OPEN_TASK_STATUSES]),
      supabase
        .from("client_matches")
        .select("id", { count: "exact", head: true })
        .gte("relevance_score", 75),
      supabase
        .from("client_matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "New"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", [...OPEN_TASK_STATUSES])
        .not("due_date", "is", null)
        .lte("due_date", formatISO(endOfWeek(new Date(), { weekStartsOn: 1 }), { representation: "date" })),
    ]);

  return {
    activeClients: clientsResult.count ?? 0,
    openTasks: openTasksResult.count ?? 0,
    highRelevanceItems: highRelevanceResult.count ?? 0,
    newIntelligenceItems: newIntelResult.count ?? 0,
    followUpsDueThisWeek: dueThisWeekResult.count ?? 0,
  };
}

export async function getRecentOpenTasks(limit = 8) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status, client_id, clients(name)")
    .in("status", [...OPEN_TASK_STATUSES])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getRecentStakeholders(limit = 8) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("stakeholders")
    .select("id, full_name, title, organization, ministry, stakeholder_type, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getRecentlyReviewedIntelligence(limit = 8) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("client_matches")
    .select(
      "id, client_id, source_item_id, status, relevance_score, updated_at, clients(name), source_items(title, published_date, source_type)",
    )
    .neq("status", "New")
    .neq("status", "Archived")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listClients() {
  const supabase = createSupabaseAdminClient();

  const [{ data: clients, error: clientsError }, { data: tasks }, { data: matches }] =
    await Promise.all([
      supabase.from("clients").select("*").order("updated_at", { ascending: false }),
      supabase.from("tasks").select("client_id, status"),
      supabase.from("client_matches").select("client_id, created_at"),
    ]);

  if (clientsError) {
    throw clientsError;
  }

  const openTaskByClient = new Map<string, number>();
  for (const task of tasks ?? []) {
    if (!task.client_id || !OPEN_TASK_STATUSES.includes(task.status as (typeof OPEN_TASK_STATUSES)[number])) {
      continue;
    }
    openTaskByClient.set(task.client_id, (openTaskByClient.get(task.client_id) ?? 0) + 1);
  }

  const today = startOfDay(new Date()).getTime();
  const recentMatchByClient = new Map<string, number>();
  for (const match of matches ?? []) {
    if (!match.client_id || !match.created_at) {
      continue;
    }
    const created = new Date(match.created_at).getTime();
    const days = (today - created) / (1000 * 60 * 60 * 24);
    if (days <= 14) {
      recentMatchByClient.set(match.client_id, (recentMatchByClient.get(match.client_id) ?? 0) + 1);
    }
  }

  return (clients ?? []).map((client) => ({
    ...client,
    openTasks: openTaskByClient.get(client.id) ?? 0,
    recentMatches: recentMatchByClient.get(client.id) ?? 0,
  }));
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function listClientWatchlist(clientId: string): Promise<WatchlistRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_watchlists")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listOpenTasks(): Promise<
  (TaskRow & {
    clients: { name: string } | null;
    stakeholders: { full_name: string } | null;
    source_items: { title: string } | null;
  })[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, clients(name), stakeholders(full_name), source_items(title)")
    .in("status", [...OPEN_TASK_STATUSES])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as (TaskRow & {
    clients: { name: string } | null;
    stakeholders: { full_name: string } | null;
    source_items: { title: string } | null;
  })[];
}

export async function listTasks(filters: TaskFilters = {}): Promise<
  (TaskRow & {
    clients: { name: string } | null;
    stakeholders: { full_name: string } | null;
    source_items: { title: string } | null;
  })[]
> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, clients(name), stakeholders(full_name), source_items(title)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const normalizedQuery = filters.query?.trim().toLowerCase();
  const normalizedOwner = filters.owner?.trim().toLowerCase();
  const today = formatISO(new Date(), { representation: "date" });
  const weekEnd = formatISO(endOfWeek(new Date(), { weekStartsOn: 1 }), { representation: "date" });

  return ((data ?? []) as (TaskRow & {
    clients: { name: string } | null;
    stakeholders: { full_name: string } | null;
    source_items: { title: string } | null;
  })[]).filter((task) => {
    if (filters.clientId && task.client_id !== filters.clientId) {
      return false;
    }
    if (filters.stakeholderId && task.stakeholder_id !== filters.stakeholderId) {
      return false;
    }
    if (filters.sourceItemId && task.source_item_id !== filters.sourceItemId) {
      return false;
    }
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    if (filters.status === "open" && !OPEN_TASK_STATUSES.includes(task.status as (typeof OPEN_TASK_STATUSES)[number])) {
      return false;
    }
    if (filters.status && filters.status !== "open" && filters.status !== "all" && task.status !== filters.status) {
      return false;
    }
    if (normalizedOwner && !(task.owner ?? "").toLowerCase().includes(normalizedOwner)) {
      return false;
    }
    if (filters.due === "overdue" && (!task.due_date || task.due_date >= today)) {
      return false;
    }
    if (filters.due === "week" && (!task.due_date || task.due_date > weekEnd)) {
      return false;
    }
    if (filters.due === "unscheduled" && task.due_date) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = `${task.title} ${task.description ?? ""} ${task.owner ?? ""} ${
        task.clients?.name ?? ""
      } ${task.stakeholders?.full_name ?? ""} ${task.source_items?.title ?? ""}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

export async function listSourceItems(): Promise<
  (Pick<
    SourceItemRow,
    "id" | "title" | "source_type" | "source_name" | "published_date" | "url" | "created_at"
  > & {
    matchesCount: number;
    topRelevance: number;
  })[]
> {
  const supabase = createSupabaseAdminClient();

  const [{ data: sourceItems, error: sourceError }, { data: matches, error: matchError }] = await Promise.all([
    supabase
      .from("source_items")
      .select("id, title, source_type, source_name, published_date, url, created_at")
      .order("published_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("client_matches").select("source_item_id, relevance_score"),
  ]);

  if (sourceError) {
    throw sourceError;
  }
  if (matchError) {
    throw matchError;
  }

  const matchStats = new Map<string, { matchesCount: number; topRelevance: number }>();
  for (const match of matches ?? []) {
    const existing = matchStats.get(match.source_item_id) ?? { matchesCount: 0, topRelevance: 0 };
    existing.matchesCount += 1;
    existing.topRelevance = Math.max(existing.topRelevance, match.relevance_score ?? 0);
    matchStats.set(match.source_item_id, existing);
  }

  return (sourceItems ?? []).map((item) => ({
    ...item,
    matchesCount: matchStats.get(item.id)?.matchesCount ?? 0,
    topRelevance: matchStats.get(item.id)?.topRelevance ?? 0,
  }));
}

export async function getSourceItemById(id: string): Promise<SourceItemRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("source_items").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function listClientMatchesForSourceItem(sourceItemId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_matches")
    .select(
      "id, client_id, source_item_id, status, relevance_score, matched_keywords, matched_themes, relevance_explanation, recommended_action, risk_level, opportunity_level, should_include_in_client_report, clients(name, industry)",
    )
    .eq("source_item_id", sourceItemId)
    .order("relevance_score", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listIntelligenceMatches(filters: IntelligenceFilters = {}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_matches")
    .select(
      "id, client_id, source_item_id, status, relevance_score, matched_keywords, matched_themes, relevance_explanation, recommended_action, created_at, clients(name), source_items(title, source_type, source_name, published_date, url, topic_tags, summary)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw error;
  }

  const normalizedQuery = filters.query?.trim().toLowerCase();

  return (data ?? []).filter((row) => {
    if (filters.clientId && row.client_id !== filters.clientId) {
      return false;
    }
    if (filters.status && row.status !== filters.status) {
      return false;
    }
    if (typeof filters.minScore === "number" && (row.relevance_score ?? 0) < filters.minScore) {
      return false;
    }
    if (typeof filters.maxScore === "number" && (row.relevance_score ?? 0) > filters.maxScore) {
      return false;
    }
    if (filters.actionRequiredOnly && row.status !== "Action required") {
      return false;
    }

    const source = Array.isArray(row.source_items) ? row.source_items[0] : row.source_items;
    if (filters.sourceType && source?.source_type !== filters.sourceType) {
      return false;
    }
    if (filters.topic && !(source?.topic_tags ?? []).includes(filters.topic)) {
      return false;
    }
    if (filters.dateFrom && source?.published_date && source.published_date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && source?.published_date && source.published_date > filters.dateTo) {
      return false;
    }
    if ((filters.dateFrom || filters.dateTo) && !source?.published_date) {
      return false;
    }

    if (normalizedQuery) {
      const haystack = `${source?.title ?? ""} ${row.relevance_explanation ?? ""} ${(row.matched_keywords ?? []).join(" ")}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

export async function listStakeholders(filters: StakeholderFilters = {}) {
  const supabase = createSupabaseAdminClient();
  const [{ data: stakeholders, error }, { data: relationships, error: relationshipsError }, { data: clients }] =
    await Promise.all([
      supabase.from("stakeholders").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("stakeholder_relationships")
        .select("stakeholder_id, client_id, relationship_strength, strategic_value, next_follow_up_date"),
      supabase.from("clients").select("id, name"),
    ]);

  if (error) {
    throw error;
  }
  if (relationshipsError) {
    throw relationshipsError;
  }

  const normalizedQuery = filters.query?.trim().toLowerCase();
  const normalizedMinistry = filters.ministry?.trim().toLowerCase();
  const normalizedOrganization = filters.organization?.trim().toLowerCase();
  const today = formatISO(new Date(), { representation: "date" });

  const clientNameById = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const relationshipsByStakeholder = new Map<
    string,
    {
      client_id: string;
      relationship_strength: string;
      strategic_value: string;
      next_follow_up_date: string | null;
    }[]
  >();

  for (const relationship of relationships ?? []) {
    const list = relationshipsByStakeholder.get(relationship.stakeholder_id) ?? [];
    list.push({
      client_id: relationship.client_id,
      relationship_strength: relationship.relationship_strength,
      strategic_value: relationship.strategic_value,
      next_follow_up_date: relationship.next_follow_up_date,
    });
    relationshipsByStakeholder.set(relationship.stakeholder_id, list);
  }

  return (stakeholders ?? [])
    .filter((row) => {
      const rowRelationships = relationshipsByStakeholder.get(row.id) ?? [];

      if (filters.relationshipStrength && !rowRelationships.some((rel) => rel.relationship_strength === filters.relationshipStrength)) {
        return false;
      }
      if (filters.strategicValue && !rowRelationships.some((rel) => rel.strategic_value === filters.strategicValue)) {
        return false;
      }
      if (filters.clientId && !rowRelationships.some((rel) => rel.client_id === filters.clientId)) {
        return false;
      }
      if (
        filters.followUpDue &&
        !rowRelationships.some((rel) => rel.next_follow_up_date && rel.next_follow_up_date <= today)
      ) {
        return false;
      }

      if (filters.stakeholderType && row.stakeholder_type !== filters.stakeholderType) {
        return false;
      }
      if (normalizedMinistry && !(row.ministry ?? "").toLowerCase().includes(normalizedMinistry)) {
        return false;
      }
      if (normalizedOrganization && !(row.organization ?? "").toLowerCase().includes(normalizedOrganization)) {
        return false;
      }
      if (filters.active === "active" && !row.active) {
        return false;
      }
      if (filters.active === "inactive" && row.active) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${row.full_name} ${row.title ?? ""} ${row.organization ?? ""} ${row.ministry ?? ""} ${
          row.notes ?? ""
        }`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    })
    .map((row) => {
      const rowRelationships = relationshipsByStakeholder.get(row.id) ?? [];
      const nextFollowUps = rowRelationships
        .map((rel) => rel.next_follow_up_date)
        .filter((date): date is string => Boolean(date))
        .sort((a, b) => a.localeCompare(b));

      const relationshipStrengths = Array.from(new Set(rowRelationships.map((rel) => rel.relationship_strength)));
      const strategicValues = Array.from(new Set(rowRelationships.map((rel) => rel.strategic_value)));
      const clientNames = Array.from(
        new Set(
          rowRelationships
            .map((rel) => clientNameById.get(rel.client_id))
            .filter((name): name is string => Boolean(name)),
        ),
      );

      return {
        ...row,
        relationships_count: rowRelationships.length,
        relationship_strengths: relationshipStrengths,
        strategic_values: strategicValues,
        next_follow_up_date: nextFollowUps[0] ?? null,
        follow_up_due: nextFollowUps.some((date) => date <= today),
        client_names: clientNames,
      };
    });
}

export async function getStakeholderById(id: string): Promise<StakeholderRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("stakeholders").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

export async function listStakeholderRelationshipsByStakeholder(stakeholderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stakeholder_relationships")
    .select(
      "id, stakeholder_id, client_id, relationship_strength, strategic_value, position_on_issue, relationship_owner, last_contact_date, next_follow_up_date, known_interests, known_sensitivities, engagement_angle, notes, clients(name, industry)",
    )
    .eq("stakeholder_id", stakeholderId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listStakeholderRelationshipsByClient(clientId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stakeholder_relationships")
    .select(
      "id, stakeholder_id, client_id, relationship_strength, strategic_value, position_on_issue, relationship_owner, last_contact_date, next_follow_up_date, known_interests, known_sensitivities, engagement_angle, notes, stakeholders(full_name, title, organization, stakeholder_type)",
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listInteractionsByStakeholder(stakeholderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("interactions")
    .select(
      "id, stakeholder_id, client_id, source_item_id, interaction_type, interaction_date, summary, attendees, outcome, follow_up_required, follow_up_deadline, notes, clients(name), source_items(title)",
    )
    .eq("stakeholder_id", stakeholderId)
    .order("interaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listOpenTasksByStakeholder(stakeholderId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status, client_id, clients(name)")
    .eq("stakeholder_id", stakeholderId)
    .in("status", [...OPEN_TASK_STATUSES])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listTasksBySourceItem(sourceItemId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, due_date, priority, status, owner, clients(name), stakeholders(full_name)")
    .eq("source_item_id", sourceItemId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listInteractionsBySourceItem(sourceItemId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("interactions")
    .select(
      "id, interaction_type, interaction_date, summary, follow_up_required, follow_up_deadline, clients(name), stakeholders(full_name)",
    )
    .eq("source_item_id", sourceItemId)
    .order("interaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listReports(): Promise<(ReportRow & { clients: { name: string } | null; itemsCount: number })[]> {
  const supabase = createSupabaseAdminClient();
  const [{ data: reports, error: reportsError }, { data: reportItems, error: reportItemsError }] = await Promise.all([
    supabase.from("reports").select("*, clients(name)").order("updated_at", { ascending: false }),
    supabase.from("report_items").select("report_id"),
  ]);

  if (reportsError) {
    throw reportsError;
  }
  if (reportItemsError) {
    throw reportItemsError;
  }

  const itemCountByReport = new Map<string, number>();
  for (const item of reportItems ?? []) {
    itemCountByReport.set(item.report_id, (itemCountByReport.get(item.report_id) ?? 0) + 1);
  }

  return (reports ?? []).map((report) => ({
    ...report,
    clients: Array.isArray(report.clients) ? report.clients[0] ?? null : report.clients,
    itemsCount: itemCountByReport.get(report.id) ?? 0,
  })) as (ReportRow & { clients: { name: string } | null; itemsCount: number })[];
}

export async function getReportById(id: string): Promise<(ReportRow & { clients: { name: string } | null }) | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("reports").select("*, clients(name)").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return {
    ...data,
    clients: Array.isArray(data.clients) ? data.clients[0] ?? null : data.clients,
  } as ReportRow & { clients: { name: string } | null };
}

export async function listReportItems(reportId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("report_items")
    .select(
      "id, report_id, source_item_id, client_match_id, sort_order, custom_summary, created_at, source_items(title, published_date, source_type), client_matches(relevance_score, status), reports(client_id)",
    )
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listAiOutputsForEntity(relatedEntityType: string, relatedEntityId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_outputs")
    .select("id, output_type, output_text, output_json, created_at")
    .eq("related_entity_type", relatedEntityType)
    .eq("related_entity_id", relatedEntityId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
