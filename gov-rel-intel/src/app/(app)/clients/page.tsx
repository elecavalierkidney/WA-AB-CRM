import Link from "next/link";

import { PageHeader } from "@/components/page-header";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Create and manage client files, watchlists, and monitoring scope."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Client</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Client Files ({activeCount} active / {clients.length} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-sm text-slate-600">No clients yet. Create the first one from the form.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recent matches (14d)</TableHead>
                    <TableHead>Open tasks</TableHead>
                    <TableHead>Last updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.industry || "—"}</TableCell>
                      <TableCell>{client.active ? "Active" : "Inactive"}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
