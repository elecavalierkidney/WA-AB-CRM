import Link from "next/link";

import { createReportAction } from "@/app/(app)/reports/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listClients, listReports } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

function readClientName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string } | undefined)?.name;
  }
  return (relation as { name?: string } | null)?.name;
}

export default async function ReportsPage() {
  const [reports, clients] = await Promise.all([listReports(), listClients()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Create and manage client intelligence reports."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createReportAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="clientId">Client</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="clientId" name="clientId">
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Weekly Monitoring Report - Sysco Alberta" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reportType">Report type</Label>
                <Input defaultValue="Weekly Monitoring" id="reportType" name="reportType" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">End date</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <Button className="w-full" type="submit">
                Create report
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-slate-600">No reports yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{readClientName(report.clients) || "—"}</TableCell>
                      <TableCell>{report.status}</TableCell>
                      <TableCell>{report.report_type}</TableCell>
                      <TableCell>{report.itemsCount}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/reports/${report.id}`}>Open</Link>
                        </Button>
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
