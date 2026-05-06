"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAppAdmin } from "@/lib/server/admin";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const passwordSchema = z.object({
  password: z.string().min(10).max(200),
  confirmPassword: z.string().min(10).max(200),
});

const emailSchema = z.object({
  email: z.string().trim().email(),
});

export async function updatePasswordAction(formData: FormData) {
  await requireAuthenticatedUser();
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success || parsed.data.password !== parsed.data.confirmPassword) {
    redirect("/settings?error=password-mismatch");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    redirect("/settings?error=password-update-failed");
  }

  redirect("/settings?updated=password");
}

export async function sendPasswordResetAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = emailSchema.safeParse({
    email: formData.get("email") || user.email,
  });

  if (!parsed.success) {
    redirect("/settings?error=invalid-email");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.APP_BASE_URL || "https://gov-rel-intel.vercel.app"}/settings`,
  });

  if (error) {
    redirect("/settings?error=reset-email-failed");
  }

  redirect("/settings?updated=reset-email");
}

export async function inviteUserAction(formData: FormData) {
  await requireAppAdmin();
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect("/settings?error=invalid-email");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${process.env.APP_BASE_URL || "https://gov-rel-intel.vercel.app"}/login`,
  });

  if (error) {
    redirect("/settings?error=invite-failed");
  }

  redirect("/settings?updated=invite-sent");
}
