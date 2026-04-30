"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  INTERACTION_TYPES,
  POSITION_ON_ISSUE_VALUES,
  RELATIONSHIP_STRENGTHS,
  STRATEGIC_VALUES,
  STAKEHOLDER_TYPES,
} from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const stakeholderSchema = z.object({
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  fullName: z.string().trim().min(2).max(240),
  title: z.string().trim().max(240).optional(),
  organization: z.string().trim().max(240).optional(),
  ministry: z.string().trim().max(240).optional(),
  riding: z.string().trim().max(240).optional(),
  stakeholderType: z.enum(STAKEHOLDER_TYPES).optional(),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().max(80).optional(),
  linkedinUrl: z.string().trim().url().max(1200).optional(),
  websiteUrl: z.string().trim().url().max(1200).optional(),
  bio: z.string().trim().max(8000).optional(),
  notes: z.string().trim().max(8000).optional(),
});

const relationshipSchema = z.object({
  stakeholderId: z.string().uuid(),
  clientId: z.string().uuid(),
  relationshipStrength: z.enum(RELATIONSHIP_STRENGTHS),
  strategicValue: z.enum(STRATEGIC_VALUES),
  positionOnIssue: z.enum(POSITION_ON_ISSUE_VALUES),
  relationshipOwner: z.string().trim().max(120).optional(),
  lastContactDate: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  knownInterests: z.string().trim().max(4000).optional(),
  knownSensitivities: z.string().trim().max(4000).optional(),
  engagementAngle: z.string().trim().max(4000).optional(),
  notes: z.string().trim().max(6000).optional(),
});

const interactionSchema = z.object({
  stakeholderId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  sourceItemId: z.string().uuid().optional(),
  interactionType: z.enum(INTERACTION_TYPES),
  interactionDate: z.string().min(1),
  summary: z.string().trim().max(4000).optional(),
  attendees: z.string().trim().max(2000).optional(),
  outcome: z.string().trim().max(4000).optional(),
  followUpRequired: z.boolean(),
  followUpDeadline: z.string().optional(),
  notes: z.string().trim().max(6000).optional(),
  createTask: z.boolean(),
  taskTitle: z.string().trim().max(240).optional(),
  taskDescription: z.string().trim().max(4000).optional(),
  taskOwner: z.string().trim().max(120).optional(),
  taskPriority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
});

const stakeholderTaskSchema = z.object({
  stakeholderId: z.string().uuid(),
  clientId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(4000).optional(),
  dueDate: z.string().optional(),
  owner: z.string().trim().max(120).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
});

export async function createStakeholderAction(formData: FormData) {
  const parsed = stakeholderSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    fullName: formData.get("fullName"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    ministry: formData.get("ministry"),
    riding: formData.get("riding"),
    stakeholderType: formData.get("stakeholderType") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    linkedinUrl: formData.get("linkedinUrl") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    bio: formData.get("bio"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("stakeholders").insert({
    first_name: parsed.data.firstName || null,
    last_name: parsed.data.lastName || null,
    full_name: parsed.data.fullName,
    title: parsed.data.title || null,
    organization: parsed.data.organization || null,
    ministry: parsed.data.ministry || null,
    riding: parsed.data.riding || null,
    stakeholder_type: parsed.data.stakeholderType || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    linkedin_url: parsed.data.linkedinUrl || null,
    website_url: parsed.data.websiteUrl || null,
    bio: parsed.data.bio || null,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/stakeholders");
}

export async function updateStakeholderAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) {
    return;
  }

  const parsed = stakeholderSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    fullName: formData.get("fullName"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    ministry: formData.get("ministry"),
    riding: formData.get("riding"),
    stakeholderType: formData.get("stakeholderType") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    linkedinUrl: formData.get("linkedinUrl") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    bio: formData.get("bio"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase
    .from("stakeholders")
    .update({
      first_name: parsed.data.firstName || null,
      last_name: parsed.data.lastName || null,
      full_name: parsed.data.fullName,
      title: parsed.data.title || null,
      organization: parsed.data.organization || null,
      ministry: parsed.data.ministry || null,
      riding: parsed.data.riding || null,
      stakeholder_type: parsed.data.stakeholderType || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      linkedin_url: parsed.data.linkedinUrl || null,
      website_url: parsed.data.websiteUrl || null,
      bio: parsed.data.bio || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id.data);

  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${id.data}`);
}

export async function setStakeholderActiveAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const active = z.coerce.boolean().safeParse(formData.get("active"));

  if (!id.success || !active.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("stakeholders").update({ active: active.data }).eq("id", id.data);

  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${id.data}`);
}

export async function upsertRelationshipAction(formData: FormData) {
  const relationshipId = z.string().uuid().optional().safeParse(formData.get("relationshipId"));
  const parsed = relationshipSchema.safeParse({
    stakeholderId: formData.get("stakeholderId"),
    clientId: formData.get("clientId"),
    relationshipStrength: formData.get("relationshipStrength"),
    strategicValue: formData.get("strategicValue"),
    positionOnIssue: formData.get("positionOnIssue"),
    relationshipOwner: formData.get("relationshipOwner"),
    lastContactDate: formData.get("lastContactDate"),
    nextFollowUpDate: formData.get("nextFollowUpDate"),
    knownInterests: formData.get("knownInterests"),
    knownSensitivities: formData.get("knownSensitivities"),
    engagementAngle: formData.get("engagementAngle"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();

  if (relationshipId.success && relationshipId.data) {
    await supabase
      .from("stakeholder_relationships")
      .update({
        relationship_strength: parsed.data.relationshipStrength,
        strategic_value: parsed.data.strategicValue,
        position_on_issue: parsed.data.positionOnIssue,
        relationship_owner: parsed.data.relationshipOwner || null,
        last_contact_date: parsed.data.lastContactDate || null,
        next_follow_up_date: parsed.data.nextFollowUpDate || null,
        known_interests: parsed.data.knownInterests || null,
        known_sensitivities: parsed.data.knownSensitivities || null,
        engagement_angle: parsed.data.engagementAngle || null,
        notes: parsed.data.notes || null,
      })
      .eq("id", relationshipId.data);
  } else {
    await supabase.from("stakeholder_relationships").upsert(
      {
        stakeholder_id: parsed.data.stakeholderId,
        client_id: parsed.data.clientId,
        relationship_strength: parsed.data.relationshipStrength,
        strategic_value: parsed.data.strategicValue,
        position_on_issue: parsed.data.positionOnIssue,
        relationship_owner: parsed.data.relationshipOwner || null,
        last_contact_date: parsed.data.lastContactDate || null,
        next_follow_up_date: parsed.data.nextFollowUpDate || null,
        known_interests: parsed.data.knownInterests || null,
        known_sensitivities: parsed.data.knownSensitivities || null,
        engagement_angle: parsed.data.engagementAngle || null,
        notes: parsed.data.notes || null,
      },
      { onConflict: "stakeholder_id,client_id" },
    );
  }

  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${parsed.data.stakeholderId}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath(`/clients/${parsed.data.clientId}/stakeholders`);
}

export async function deleteRelationshipAction(formData: FormData) {
  const relationshipId = z.string().uuid().safeParse(formData.get("relationshipId"));
  const stakeholderId = z.string().uuid().safeParse(formData.get("stakeholderId"));
  const clientId = z.string().uuid().safeParse(formData.get("clientId"));

  if (!relationshipId.success || !stakeholderId.success || !clientId.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("stakeholder_relationships").delete().eq("id", relationshipId.data);

  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${stakeholderId.data}`);
  revalidatePath(`/clients/${clientId.data}`);
  revalidatePath(`/clients/${clientId.data}/stakeholders`);
}

export async function createInteractionAction(formData: FormData) {
  const parsed = interactionSchema.safeParse({
    stakeholderId: formData.get("stakeholderId"),
    clientId: formData.get("clientId") || undefined,
    sourceItemId: formData.get("sourceItemId") || undefined,
    interactionType: formData.get("interactionType"),
    interactionDate: formData.get("interactionDate"),
    summary: formData.get("summary"),
    attendees: formData.get("attendees"),
    outcome: formData.get("outcome"),
    followUpRequired: formData.get("followUpRequired") === "on",
    followUpDeadline: formData.get("followUpDeadline"),
    notes: formData.get("notes"),
    createTask: formData.get("createTask") === "on",
    taskTitle: formData.get("taskTitle"),
    taskDescription: formData.get("taskDescription"),
    taskOwner: formData.get("taskOwner"),
    taskPriority: (formData.get("taskPriority") as string) || "Medium",
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("interactions").insert({
    stakeholder_id: parsed.data.stakeholderId,
    client_id: parsed.data.clientId || null,
    source_item_id: parsed.data.sourceItemId || null,
    interaction_type: parsed.data.interactionType,
    interaction_date: parsed.data.interactionDate,
    summary: parsed.data.summary || null,
    attendees: parsed.data.attendees || null,
    outcome: parsed.data.outcome || null,
    follow_up_required: parsed.data.followUpRequired,
    follow_up_deadline: parsed.data.followUpDeadline || null,
    notes: parsed.data.notes || null,
  });

  if (parsed.data.createTask && parsed.data.taskTitle) {
    await supabase.from("tasks").insert({
      title: parsed.data.taskTitle,
      description:
        parsed.data.taskDescription ||
        parsed.data.summary ||
        "Follow-up task created from stakeholder interaction.",
      stakeholder_id: parsed.data.stakeholderId,
      client_id: parsed.data.clientId || null,
      due_date: parsed.data.followUpDeadline || null,
      owner: parsed.data.taskOwner || null,
      priority: parsed.data.taskPriority || "Medium",
      status: "Not started",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${parsed.data.stakeholderId}`);
  if (parsed.data.clientId) {
    revalidatePath(`/clients/${parsed.data.clientId}`);
    revalidatePath(`/clients/${parsed.data.clientId}/stakeholders`);
  }
}

export async function createStakeholderTaskAction(formData: FormData) {
  const parsed = stakeholderTaskSchema.safeParse({
    stakeholderId: formData.get("stakeholderId"),
    clientId: formData.get("clientId") || undefined,
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    owner: formData.get("owner"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("tasks").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    stakeholder_id: parsed.data.stakeholderId,
    client_id: parsed.data.clientId || null,
    due_date: parsed.data.dueDate || null,
    owner: parsed.data.owner || null,
    priority: parsed.data.priority,
    status: "Not started",
  });

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/stakeholders");
  revalidatePath(`/stakeholders/${parsed.data.stakeholderId}`);
  if (parsed.data.clientId) {
    revalidatePath(`/clients/${parsed.data.clientId}`);
    revalidatePath(`/clients/${parsed.data.clientId}/stakeholders`);
  }
}
