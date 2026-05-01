import Link from "next/link";
import { CalendarClock, Filter, Handshake, Plus, UsersRound } from "lucide-react";

import { createStakeholderAction, setStakeholderActiveAction } from "@/app/(app)/stakeholders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GOVERNMENT_STAKEHOLDER_TYPES, RELATIONSHIP_STRENGTHS, STRATEGIC_VALUES } from "@/lib/constants";
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
    directoryType: "government",
  });
  const activeCount = stakeholders.filter((stakeholder) => stakeholder.active).length;
  const relationshipCount = stakeholders.reduce(
    (total, stakeholder) => total + (stakeholder.relationships_count ?? 0),
    0,
  );
  const followUpDueCount = stakeholders.filter((stakeholder) => stakeholder.follow_up_due).length;
  const highValueCount = stakeholders.filter((stakeholder) =>
    ((stakeholder.strategic_values ?? []) as string[]).some((value) => value === "High" || value === "Critical"),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Government contacts"
        description="Track elected officials, political staff, public servants, and public-sector relationships across client files."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/contacts">Contacts</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Visible stakeholders</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{stakeholders.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <UsersRound className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Active</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{activeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
              <UsersRound className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Client links</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{relationshipCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <Handshake className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Follow-ups due</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{followUpDueCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.85fr)_2fr]">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Plus className="h-4 w-4 text-emerald-700" />
              Create government contact
            </CardTitle>
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
                    {GOVERNMENT_STAKEHOLDER_TYPES.map((type) => (
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

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Stakeholder directory</CardTitle>
            <p className="text-sm text-slate-600">
              {stakeholders.length} visible, {highValueCount} high-value relationships.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 xl:grid-cols-4" method="get">
              <div className="flex items-center gap-2 xl:col-span-4">
                <Filter className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-900">Filters</p>
              </div>
              <Input defaultValue={filters.query || ""} name="query" placeholder="Search name, org, notes" />
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.stakeholderType || ""}
                name="stakeholderType"
              >
                <option value="">All types</option>
                {GOVERNMENT_STAKEHOLDER_TYPES.map((type) => (
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
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No stakeholders found for current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Clients</TableHead>
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
                        <TableCell>
                          <div className="min-w-56">
                            <Link className="font-semibold text-slate-950 hover:underline" href={`/stakeholders/${stakeholder.id}`}>
                              {stakeholder.full_name}
                            </Link>
                            {stakeholder.title ? <p className="text-xs text-slate-500">{stakeholder.title}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell>{stakeholder.stakeholder_type || "—"}</TableCell>
                        <TableCell>
                          <div className="min-w-44">
                            <p>{stakeholder.organization || "—"}</p>
                            {stakeholder.ministry ? <p className="text-xs text-slate-500">{stakeholder.ministry}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-44">
                            <p>{stakeholder.relationships_count ?? 0}</p>
                            <p className="line-clamp-1 text-xs text-slate-500">
                              {(stakeholder.client_names ?? []).join(", ") || "No linked clients"}
                            </p>
                          </div>
                        </TableCell>
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
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
