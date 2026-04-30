import Link from "next/link";

import { createStakeholderAction, setStakeholderActiveAction } from "@/app/(app)/stakeholders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RELATIONSHIP_STRENGTHS, STAKEHOLDER_TYPES, STRATEGIC_VALUES } from "@/lib/constants";
import { listClients, listStakeholders } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    stakeholderType?: string;
    ministry?: string;
    organization?: string;
    relationshipStrength?: string;
    strategicValue?: string;
    clientId?: string;
    followUpDue?: string;
    active?: "active" | "inactive" | "all";
  }>;
}

export default async function StakeholdersPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const clients = await listClients();
  const stakeholders = await listStakeholders({
    query: filters.query,
    stakeholderType: filters.stakeholderType,
    ministry: filters.ministry,
    organization: filters.organization,
    relationshipStrength: filters.relationshipStrength,
    strategicValue: filters.strategicValue,
    clientId: filters.clientId,
    followUpDue: filters.followUpDue === "true",
    active: filters.active || "all",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stakeholders"
        description="Track officials, staff, partners, and contacts across client files."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Stakeholder</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createStakeholderAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" name="organization" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="ministry">Ministry</Label>
                  <Input id="ministry" name="ministry" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stakeholderType">Stakeholder type</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="stakeholderType" name="stakeholderType">
                    <option value="">Select type</option>
                    {STAKEHOLDER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button className="w-full" type="submit">
                Save stakeholder
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stakeholder Directory ({stakeholders.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 md:grid-cols-4" method="get">
              <Input defaultValue={filters.query || ""} name="query" placeholder="Search name, org, notes" />
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.stakeholderType || ""}
                name="stakeholderType"
              >
                <option value="">All types</option>
                {STAKEHOLDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Input defaultValue={filters.ministry || ""} name="ministry" placeholder="Ministry contains..." />
              <Input defaultValue={filters.organization || ""} name="organization" placeholder="Organization contains..." />
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.relationshipStrength || ""}
                name="relationshipStrength"
              >
                <option value="">All relationship strengths</option>
                {RELATIONSHIP_STRENGTHS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.strategicValue || ""}
                name="strategicValue"
              >
                <option value="">All strategic values</option>
                {STRATEGIC_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.clientId || ""}
                name="clientId"
              >
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 rounded-md border border-slate-300 p-2">
                <input
                  defaultChecked={filters.followUpDue === "true"}
                  id="followUpDue"
                  name="followUpDue"
                  type="checkbox"
                  value="true"
                />
                <Label className="text-sm text-slate-700" htmlFor="followUpDue">
                  Follow-up due
                </Label>
              </div>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-md border border-slate-300 p-2 text-sm"
                  defaultValue={filters.active || "all"}
                  name="active"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Button type="submit" variant="outline">
                  Filter
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/stakeholders">Reset</Link>
                </Button>
              </div>
            </form>

            {stakeholders.length === 0 ? (
              <p className="text-sm text-slate-600">No stakeholders found for current filters.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Client links</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Strategic value</TableHead>
                    <TableHead>Next follow-up</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stakeholders.map((stakeholder) => (
                    <TableRow key={stakeholder.id}>
                      <TableCell className="font-medium">{stakeholder.full_name}</TableCell>
                      <TableCell>{stakeholder.stakeholder_type || "—"}</TableCell>
                      <TableCell>{stakeholder.title || "—"}</TableCell>
                      <TableCell>{stakeholder.organization || "—"}</TableCell>
                      <TableCell>{stakeholder.relationships_count ?? 0}</TableCell>
                      <TableCell>{(stakeholder.relationship_strengths ?? []).join(", ") || "—"}</TableCell>
                      <TableCell>{(stakeholder.strategic_values ?? []).join(", ") || "—"}</TableCell>
                      <TableCell>
                        {stakeholder.next_follow_up_date ? (
                          <StatusPill
                            className={
                              stakeholder.follow_up_due
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }
                            label={stakeholder.next_follow_up_date}
                          />
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          className={
                            stakeholder.active
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-zinc-700 border-zinc-200"
                          }
                          label={stakeholder.active ? "Active" : "Inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/stakeholders/${stakeholder.id}`}>Open</Link>
                          </Button>
                          <form action={setStakeholderActiveAction}>
                            <input name="id" type="hidden" value={stakeholder.id} />
                            <input name="active" type="hidden" value={stakeholder.active ? "false" : "true"} />
                            <Button size="sm" type="submit" variant="ghost">
                              {stakeholder.active ? "Archive" : "Activate"}
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
