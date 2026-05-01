import Link from "next/link";
import { notFound } from "next/navigation";
import { BellDot, Settings, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getClientById, listClientWatchlist } from "@/lib/server/queries";

import { updateClientAction } from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const watchlist = await listClientWatchlist(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description="Manage file details and monitoring settings for this client."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/clients/${id}/watchlist`}>Manage watchlist</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/clients">Back to clients</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Client profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateClientAction} className="space-y-3">
              <input name="id" type="hidden" value={client.id} />
              <div className="space-y-1">
                <Label htmlFor="name">Client name</Label>
                <Input defaultValue={client.name} id="name" name="name" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="industry">Industry</Label>
                  <Input defaultValue={client.industry || ""} id="industry" name="industry" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="primaryContact">Primary contact</Label>
                  <Input
                    defaultValue={client.primary_contact || ""}
                    id="primaryContact"
                    name="primaryContact"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea defaultValue={client.description || ""} id="description" name="description" rows={6} />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Watchlist snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {watchlist.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No watchlist terms yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {watchlist.slice(0, 12).map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.keyword}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
          href={`/clients/${id}/intelligence`}
        >
          <BellDot className="h-4 w-4 text-amber-600" />
          Client intelligence
        </Link>
        <Link
          className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
          href={`/clients/${id}/stakeholders`}
        >
          <Users className="h-4 w-4 text-blue-600" />
          Client stakeholders
        </Link>
        <Link
          className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-md"
          href={`/clients/${id}/watchlist`}
        >
          <Settings className="h-4 w-4 text-emerald-700" />
          Watchlist terms
        </Link>
      </section>
    </div>
  );
}
