import { redirect } from "next/navigation";

import { signOutAction } from "@/app/login/actions";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <AppSidebar />
      <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="flex flex-col gap-3 rounded-md border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-semibold text-slate-900">{user.email}</p>
            </div>
            <form action={signOutAction}>
              <Button size="sm" type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
