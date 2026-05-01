import Link from "next/link";
import { ContactRound, FileSpreadsheet, Mail, Phone, Plus } from "lucide-react";

import { createContactAction } from "@/app/(app)/contacts/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { GENERAL_CONTACT_TYPES } from "@/lib/constants";
import { listStakeholders } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    organization?: string;
    stakeholderType?: string;
    active?: "active" | "inactive" | "all";
  }>;
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const contacts = await listStakeholders({
    query: filters.query,
    organization: filters.organization,
    stakeholderType: filters.stakeholderType,
    active: filters.active || "all",
    directoryType: "general",
  });
  const activeCount = contacts.filter((contact) => contact.active).length;
  const emailCount = contacts.filter((contact) => contact.email).length;
  const phoneCount = contacts.filter((contact) => contact.phone).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage client, association, media, and other non-government contacts."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/stakeholders">Government contacts</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Visible contacts</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{contacts.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <ContactRound className="h-4 w-4" />
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
              <ContactRound className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">With email</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{emailCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <Mail className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">With phone</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{phoneCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
              <Phone className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.85fr)_2fr]">
        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <Plus className="h-4 w-4 text-emerald-700" />
                Add contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createContactAction} className="space-y-3">
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
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" name="organization" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactType">Contact type</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Other" id="contactType" name="contactType">
                    {GENERAL_CONTACT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
                <Button className="w-full" type="submit">
                  Save contact
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <FileSpreadsheet className="h-4 w-4 text-slate-600" />
              Contact directory
            </CardTitle>
            <p className="text-sm text-slate-600">{contacts.length} visible contacts.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 xl:grid-cols-4" method="get">
              <Input defaultValue={filters.query || ""} name="query" placeholder="Search name, org, notes" />
              <Input defaultValue={filters.organization || ""} name="organization" placeholder="Organization contains..." />
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.stakeholderType || ""}
                name="stakeholderType"
              >
                <option value="">All contact types</option>
                {GENERAL_CONTACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={filters.active || "all"} name="active">
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <Button type="submit" variant="outline">
                  Filter
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/contacts">Reset</Link>
                </Button>
              </div>
            </form>

            {contacts.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No contacts found. Add one manually or import a directory spreadsheet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="min-w-56">
                            <p className="font-semibold text-slate-950">{contact.full_name}</p>
                            {contact.title ? <p className="text-xs text-slate-500">{contact.title}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell>{contact.stakeholder_type || "Other"}</TableCell>
                        <TableCell>{contact.organization || "-"}</TableCell>
                        <TableCell>{contact.email || "-"}</TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>
                          <StatusPill
                            className={
                              contact.active
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-zinc-100 text-zinc-700 border-zinc-200"
                            }
                            label={contact.active ? "Active" : "Inactive"}
                          />
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
