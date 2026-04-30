"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const taskSchema = z.object({
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().max(4000).optional(),
  clientId: z.string().uuid().optional(),
  stakeholderId: z.string().uuid().optional(),
  sourceItemId: z.string().uuid().optional(),
  owner: z.string().trim().max(120).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  status: z.enum(["Not started", "In progress", "Waiting", "Complete", "Cancelled"]),
});

export async function createTaskAction(formData: FormData) {
  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    clientId: formData.get("clientId") || undefined,
    stakeholderId: formData.get("stakeholderId") || undefined,
    sourceItemId: formData.get("sourceItemId") || undefined,
    owner: formData.get("owner"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority") || "Medium",
    status: formData.get("status") || "Not started",
  });

  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("tasks").insert({
    title: parsed.data.title,
    description: parsed.data.description || null,
    client_id: parsed.data.clientId || null,
    stakeholder_id: parsed.data.stakeholderId || null,
    source_item_id: parsed.data.sourceItemId || null,
    owner: parsed.data.owner || null,
    due_date: parsed.data.dueDate || null,
    priority: parsed.data.priority,
    status: parsed.data.status,
  });

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/tasks");
}

export async function setTaskStatusAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const status = z
    .enum(["Not started", "In progress", "Waiting", "Complete", "Cancelled"])
    .safeParse(formData.get("status"));

  if (!id.success || !status.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("tasks")
    .update({
      status: status.data,
      completed_at: status.data === "Complete" ? new Date().toISOString() : null,
    })
    .eq("id", id.data);

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
