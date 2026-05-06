import "server-only";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/server/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const fallbackAdminUserIds = new Set(
  (process.env.ADMIN_USER_IDS || "dbfd3f74-14ac-444a-9041-e52fe7967d0b")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

export async function getRlsAdminStatus(userId?: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_admins")
    .select("user_id, active")
    .eq("user_id", userId || "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  if (error) {
    return {
      tableExists: false,
      isAdmin: fallbackAdminUserIds.has(userId || ""),
      error: error.message,
    };
  }

  return {
    tableExists: true,
    isAdmin: Boolean(data?.active) || fallbackAdminUserIds.has(userId || ""),
    error: null,
  };
}

export async function requireAppAdmin() {
  const user = await requireAuthenticatedUser();
  const status = await getRlsAdminStatus(user.id);

  if (!status.isAdmin) {
    redirect("/settings?error=admin-required");
  }

  return user;
}
