import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen bg-[#f7f9fb] text-slate-950 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <AppSidebar />
      <main className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200/80 bg-[#f7f9fb]/95 px-1 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:-mx-1 lg:pt-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Secure workspace</p>
                <p className="truncate text-sm font-semibold text-slate-950">{user.email}</p>
              </div>
            </div>
            <form action={signOutAction}>
              <Button className="w-full sm:w-auto" size="sm" type="submit" variant="outline">
                <LogOut className="h-3.5 w-3.5" />
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
