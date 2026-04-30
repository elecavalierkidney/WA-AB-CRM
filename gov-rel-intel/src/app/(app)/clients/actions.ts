"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const clientSchema = z.object({
  name: z.string().trim().min(2).max(200),
  industry: z.string().trim().max(200).optional(),
  primaryContact: z.string().trim().max(200).optional(),
  description: z.string().trim().max(6000).optional(),
});

const watchlistSchema = z.object({
  keyword: z.string().trim().min(2).max(200),
  category: z.string().trim().max(200).optional(),
  weight: z.coerce.number().int().min(1).max(10),
});

export async function createClientAction(formData: FormData) {
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    primaryContact: formData.get("primaryContact"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("clients").insert({
    name: parsed.data.name,
    industry: parsed.data.industry || null,
    primary_contact: parsed.data.primaryContact || null,
    description: parsed.data.description || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/clients");
}

export async function updateClientAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) {
    return;
  }

  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry"),
    primaryContact: formData.get("primaryContact"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      industry: parsed.data.industry || null,
      primary_contact: parsed.data.primaryContact || null,
      description: parsed.data.description || null,
    })
    .eq("id", id.data);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id.data}`);
}

export async function setClientActiveAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const active = z.coerce.boolean().safeParse(formData.get("active"));

  if (!id.success || !active.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("clients").update({ active: active.data }).eq("id", id.data);

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id.data}`);
}

export async function createWatchlistItemAction(formData: FormData) {
  const clientId = z.string().uuid().safeParse(formData.get("clientId"));
  if (!clientId.success) {
    return;
  }

  const parsed = watchlistSchema.safeParse({
    keyword: formData.get("keyword"),
    category: formData.get("category"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("client_watchlists").insert({
    client_id: clientId.data,
    keyword: parsed.data.keyword,
    category: parsed.data.category || null,
    weight: parsed.data.weight,
  });

  revalidatePath(`/clients/${clientId.data}`);
  revalidatePath(`/clients/${clientId.data}/watchlist`);
}

export async function updateWatchlistItemAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const clientId = z.string().uuid().safeParse(formData.get("clientId"));
  if (!id.success || !clientId.success) {
    return;
  }

  const parsed = watchlistSchema.safeParse({
    keyword: formData.get("keyword"),
    category: formData.get("category"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("client_watchlists")
    .update({
      keyword: parsed.data.keyword,
      category: parsed.data.category || null,
      weight: parsed.data.weight,
    })
    .eq("id", id.data);

  revalidatePath(`/clients/${clientId.data}`);
  revalidatePath(`/clients/${clientId.data}/watchlist`);
}

export async function deleteWatchlistItemAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const clientId = z.string().uuid().safeParse(formData.get("clientId"));
  if (!id.success || !clientId.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("client_watchlists").delete().eq("id", id.data);

  revalidatePath(`/clients/${clientId.data}`);
  revalidatePath(`/clients/${clientId.data}/watchlist`);
}
