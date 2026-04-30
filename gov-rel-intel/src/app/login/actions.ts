"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPathSchema } from "@/lib/validation";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  next: safeInternalPathSchema.optional(),
});

function loginError(message: string): never {
  return redirect(`/login?error=${encodeURIComponent(message)}`);
}

export async function signInWithPasswordAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) {
    loginError("Enter a valid email and password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    loginError("Sign-in failed. Check credentials and try again.");
  }

  redirect(parsed.data.next || "/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
