"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GENERAL_CONTACT_TYPES } from "@/lib/constants";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  fullName: z.string().trim().min(2).max(240),
  title: z.string().trim().max(240).optional(),
  organization: z.string().trim().max(240).optional(),
  contactType: z.enum(GENERAL_CONTACT_TYPES).default("Other"),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(8000).optional(),
});

export async function createContactAction(formData: FormData) {
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    fullName: formData.get("fullName"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    contactType: formData.get("contactType") || "Other",
    email: formData.get("email") || undefined,
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return;
  }

  await requireAuthenticatedUser();
  const supabase = createSupabaseAdminClient();
  await supabase.from("stakeholders").insert({
    first_name: parsed.data.firstName || null,
    last_name: parsed.data.lastName || null,
    full_name: parsed.data.fullName,
    title: parsed.data.title || null,
    organization: parsed.data.organization || null,
    stakeholder_type: parsed.data.contactType,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/contacts");
}
