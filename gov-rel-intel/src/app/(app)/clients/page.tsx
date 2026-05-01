import Link from "next/link";
import { Archive, BriefcaseBusiness, FolderOpen, Plus, TimerReset } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { listClients } from "@/lib/server/queries";

import { createClientAction, setClientActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();
  const activeCount = clients.filter((client) => client.active).length;
  const archivedCount = clients.length - activeCount;
  const openTaskCount = clients.reduce((total, client) => total + client.openTasks, 0);
  const recentMatchCount = clients.reduce((total, client) => total + client.recentMatches, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Create and manage client files, watchlists, and monitoring scope."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Active clients</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{activeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Archived</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{archivedCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
              <Archive className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Recent matches</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{recentMatchCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
              <TimerReset className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Open tasks</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{openTaskCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <FolderOpen className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.85fr)_2fr]">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Plus className="h-4 w-4 text-emerald-700" />
              Create client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createClientAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="name">Client name</Label>
                <Input id="name" name="name" placeholder="Sysco Alberta" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" name="industry" placeholder="Food logistics / food service distribution" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="primaryContact">Primary contact</Label>
                <Input id="primaryContact" name="primaryContact" placeholder="Name and role" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add the policy, regulatory, and stakeholder context for this client file."
                  rows={4}
                />
              </div>
              <Button className="w-full" type="submit">
                Save client
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">
              Client files
            </CardTitle>
            <p className="text-sm text-slate-600">{activeCount} active / {clients.length} total</p>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No clients yet. Create the first one from the form.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recent matches</TableHead>
                      <TableHead>Open tasks</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="min-w-48">
                            <Link className="font-semibold text-slate-950 hover:underline" href={`/clients/${client.id}`}>
                              {client.name}
                            </Link>
                            {client.primary_contact ? (
                              <p className="text-xs text-slate-500">{client.primary_contact}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>{client.industry || "—"}</TableCell>
                        <TableCell>
                          <StatusPill
                            className={
                              client.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                            }
                            label={client.active ? "Active" : "Inactive"}
                          />
                        </TableCell>
                        <TableCell>{client.recentMatches}</TableCell>
                        <TableCell>{client.openTasks}</TableCell>
                        <TableCell>{new Date(client.updated_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/clients/${client.id}`}>Open</Link>
                            </Button>
                            <form action={setClientActiveAction}>
                              <input name="id" type="hidden" value={client.id} />
                              <input name="active" type="hidden" value={client.active ? "false" : "true"} />
                              <Button size="sm" type="submit" variant="ghost">
                                {client.active ? "Archive" : "Activate"}
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
