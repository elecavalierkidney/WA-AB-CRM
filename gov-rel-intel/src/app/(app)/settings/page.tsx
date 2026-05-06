import { inviteUserAction, sendPasswordResetAction, updatePasswordAction } from "@/app/(app)/settings/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRlsAdminStatus } from "@/lib/server/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
];
const optionalEnv = ["OPENAI_MODEL", "CRON_SECRET", "APP_BASE_URL"];

interface SettingsPageProps {
  searchParams: Promise<{
    updated?: string;
    error?: string;
  }>;
}

function readMessage(updated?: string, error?: string) {
  if (updated === "password") return "Password updated.";
  if (updated === "reset-email") return "Password reset email sent.";
  if (updated === "invite-sent") return "Invite email sent.";
  if (error === "admin-required") return "Admin access is required for that action.";
  if (error === "password-mismatch") return "Passwords must match and be at least 10 characters.";
  if (error === "password-update-failed") return "Password update failed. Try signing in again.";
  if (error === "reset-email-failed") return "Password reset email could not be sent.";
  if (error === "invite-failed") return "Invite could not be sent. Check Supabase Auth email settings.";
  if (error === "invalid-email") return "Enter a valid email address.";
  return null;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const rlsStatus = await getRlsAdminStatus(user?.id);
  const message = readMessage(params.updated, params.error);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Account controls, admin access, and platform setup guidance."
      />

      {message ? (
        <p
          className={
            params.error
              ? "rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          }
        >
          {message}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-950">{user?.email}</p>
              <p className="mt-1 text-xs text-slate-500">Signed in user</p>
            </div>
            <form action={updatePasswordAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" required type="password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" name="confirmPassword" required type="password" />
              </div>
              <Button type="submit">Change password</Button>
            </form>
            <form action={sendPasswordResetAction} className="flex flex-col gap-2 sm:flex-row">
              <input name="email" type="hidden" value={user?.email || ""} />
              <Button type="submit" variant="outline">Email reset link</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-base">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              <StatusPill
                className={
                  rlsStatus.tableExists
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"
                }
                label={rlsStatus.tableExists ? "RLS admin table found" : "RLS migration pending"}
              />
              <StatusPill
                className={
                  rlsStatus.isAdmin
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }
                label={rlsStatus.isAdmin ? "Current user admin" : "Current user not admin"}
              />
            </div>
            {!rlsStatus.tableExists ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
                Supabase RLS is still pending. Run the migration in
                <span className="font-mono"> supabase/migrations/20260430172000_lock_down_authenticated_rls.sql</span>,
                then insert your admin user.
              </p>
            ) : null}
            <form action={inviteUserAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="inviteEmail">Invite user by email</Label>
                <Input id="inviteEmail" name="email" placeholder="person@example.com" required type="email" />
              </div>
              <Button disabled={!rlsStatus.isAdmin} type="submit">Send invite</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {requiredEnv.map((variable) => (
            <p className="rounded bg-slate-100 px-2 py-1 font-mono text-xs" key={variable}>
              {variable}
            </p>
          ))}
          <p className="pt-2 text-slate-600">
            Add these to your local environment before running full Supabase + AI workflows.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {optionalEnv.map((variable) => (
            <p className="rounded bg-slate-100 px-2 py-1 font-mono text-xs" key={variable}>
              {variable}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
