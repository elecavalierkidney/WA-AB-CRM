import Link from "next/link";
import { notFound } from "next/navigation";

import { addReportItemAction, removeReportItemAction, updateReportAction } from "@/app/(app)/reports/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getReportById, listIntelligenceMatches, listReportItems, listSourceItems } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function readSourceInfo(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { title?: string; published_date?: string; source_type?: string } | undefined) ?? {};
  }
  return (relation as { title?: string; published_date?: string; source_type?: string } | null) ?? {};
}

function readMatchInfo(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { relevance_score?: number; status?: string } | undefined) ?? {};
  }
  return (relation as { relevance_score?: number; status?: string } | null) ?? {};
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReportById(id);

  if (!report) {
    notFound();
  }

  const [reportItems, sourceItems, matches] = await Promise.all([
    listReportItems(id),
    listSourceItems(),
    listIntelligenceMatches({
      clientId: report.client_id || undefined,
    }),
  ]);

  const markdownExport = [
    `# ${report.title}`,
    "",
    `- Client: ${Array.isArray(report.clients) ? report.clients[0]?.name || "N/A" : report.clients?.name || "N/A"}`,
    `- Report type: ${report.report_type}`,
    `- Date range: ${report.start_date || "N/A"} to ${report.end_date || "N/A"}`,
    `- Status: ${report.status}`,
    "",
    report.body || "",
    "",
    "## Included Intelligence",
    ...reportItems.map((item, index) => {
      const source = readSourceInfo(item.source_items);
      const summary = item.custom_summary || `Source: ${source.title || "Untitled source"}`;
      return `${index + 1}. ${summary}`;
    }),
  ].join("\n");

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.title}
        description="Edit report metadata, body, and included intelligence."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/reports">Back to reports</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateReportAction} className="space-y-3">
              <input name="id" type="hidden" value={report.id} />
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input defaultValue={report.title} id="title" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reportType">Report type</Label>
                <Input defaultValue={report.report_type} id="reportType" name="reportType" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input defaultValue={report.start_date || ""} id="startDate" name="startDate" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate">End date</Label>
                  <Input defaultValue={report.end_date || ""} id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Status</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={report.status} id="status" name="status">
                  <option value="Draft">Draft</option>
                  <option value="In review">In review</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="body">Body</Label>
                <Textarea defaultValue={report.body || ""} id="body" name="body" rows={10} />
              </div>
              <Button className="w-full" type="submit">
                Save report
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Intelligence Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={addReportItemAction} className="space-y-3">
              <input name="reportId" type="hidden" value={report.id} />
              <div className="space-y-1">
                <Label htmlFor="sourceItemId">Source item</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="sourceItemId" name="sourceItemId">
                  <option value="">None</option>
                  {sourceItems.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clientMatchId">Client match</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="clientMatchId" name="clientMatchId">
                  <option value="">None</option>
                  {matches.map((match) => {
                    const source = Array.isArray(match.source_items) ? match.source_items[0] : match.source_items;
                    const client = Array.isArray(match.clients) ? match.clients[0] : match.clients;
                    return (
                      <option key={match.id} value={match.id}>
                        {(client?.name || "Client") + " - " + (source?.title || "Source")}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="customSummary">Custom summary (optional)</Label>
                <Textarea id="customSummary" name="customSummary" rows={3} />
              </div>
              <Button className="w-full" type="submit" variant="outline">
                Add item
              </Button>
            </form>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Markdown export preview</p>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{markdownExport}</pre>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report Items ({reportItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reportItems.length === 0 ? (
            <p className="text-sm text-slate-600">No items added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Match score</TableHead>
                  <TableHead>Match status</TableHead>
                  <TableHead>Custom summary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportItems.map((item) => {
                  const source = readSourceInfo(item.source_items);
                  const match = readMatchInfo(item.client_matches);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{source.title || "—"}</TableCell>
                      <TableCell>{source.published_date || "—"}</TableCell>
                      <TableCell>{source.source_type || "—"}</TableCell>
                      <TableCell>{match.relevance_score ?? "—"}</TableCell>
                      <TableCell>{match.status || "—"}</TableCell>
                      <TableCell className="max-w-md text-sm text-slate-700">{item.custom_summary || "—"}</TableCell>
                      <TableCell className="text-right">
                        <form action={removeReportItemAction}>
                          <input name="id" type="hidden" value={item.id} />
                          <input name="reportId" type="hidden" value={report.id} />
                          <Button size="sm" type="submit" variant="ghost">
                            Remove
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
