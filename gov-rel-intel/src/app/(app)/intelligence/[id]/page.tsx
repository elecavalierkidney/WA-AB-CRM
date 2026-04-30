import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addClientMatchToReportAction,
  createTaskFromIntelligenceAction,
  generateClientUpdateFromIntelligenceAction,
  generateMeetingRequestFromIntelligenceAction,
  linkStakeholderToIntelligenceAction,
  rerunMatchingAction,
  updateClientMatchStatusAction,
} from "@/app/(app)/intelligence/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CLIENT_MATCH_STATUSES, CLIENT_MATCH_STATUS_STYLES, SOURCE_TYPE_STYLES } from "@/lib/constants";
import {
  getSourceItemById,
  listAiOutputsForEntity,
  listClientMatchesForSourceItem,
  listInteractionsBySourceItem,
  listReports,
  listStakeholders,
  listTasksBySourceItem,
} from "@/lib/server/queries";
import { safeHttpUrl } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function readClientInfo(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string; industry?: string } | undefined) ?? {};
  }
  return (relation as { name?: string; industry?: string } | null) ?? {};
}

function readClientName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string } | undefined)?.name;
  }
  return (relation as { name?: string } | null)?.name;
}

function readStakeholderName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { full_name?: string } | undefined)?.full_name;
  }
  return (relation as { full_name?: string } | null)?.full_name;
}

function readFirstStringFromJson(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : null;
}

export default async function IntelligenceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [sourceItem, matches, stakeholders, reports, linkedTasks, linkedInteractions] = await Promise.all([
    getSourceItemById(id),
    listClientMatchesForSourceItem(id),
    listStakeholders({ active: "active" }),
    listReports(),
    listTasksBySourceItem(id),
    listInteractionsBySourceItem(id),
  ]);

  if (!sourceItem) {
    notFound();
  }

  const sourceUrl = safeHttpUrl(sourceItem.url);

  const aiOutputsByMatch = new Map<
    string,
    {
      meetingDraft: { output_text: string | null; output_json: unknown } | null;
      clientUpdateDraft: { output_text: string | null; output_json: unknown } | null;
    }
  >();
  const aiOutputLists = await Promise.all(matches.map((match) => listAiOutputsForEntity("client_match", match.id)));
  for (let index = 0; index < matches.length; index += 1) {
    const matchId = matches[index].id;
    const outputs = aiOutputLists[index];
    aiOutputsByMatch.set(matchId, {
      meetingDraft: outputs.find((output) => output.output_type === "meeting_request_draft") ?? null,
      clientUpdateDraft: outputs.find((output) => output.output_type === "client_update_draft") ?? null,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={sourceItem.title}
        description="Source item details and client match intelligence."
        actions={
          <div className="flex gap-2">
            <form action={rerunMatchingAction}>
              <input name="sourceItemId" type="hidden" value={sourceItem.id} />
              <Button size="sm" type="submit" variant="outline">
                Re-run AI analysis
              </Button>
            </form>
            <Button asChild size="sm" variant="outline">
              <Link href="/intelligence">Back to feed</Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Source Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <StatusPill
                className={SOURCE_TYPE_STYLES[sourceItem.source_type] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                label={sourceItem.source_type}
              />
              {sourceItem.ministry ? (
                <StatusPill className="bg-slate-100 text-slate-700 border-slate-200" label={sourceItem.ministry} />
              ) : null}
            </div>
            <p className="text-slate-700">Published: {sourceItem.published_date || "Unknown"}</p>
            <p className="text-slate-700">Source: {sourceItem.source_name || "Unknown source"}</p>
            {sourceUrl ? (
              <p>
                <a className="text-blue-700 underline" href={sourceUrl} rel="noreferrer" target="_blank">
                  {sourceUrl}
                </a>
              </p>
            ) : null}
            {sourceItem.summary ? (
              <div className="rounded-md bg-slate-50 p-3 text-slate-700">
                <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">AI summary</p>
                <p>{sourceItem.summary}</p>
              </div>
            ) : (
              <p className="text-slate-500">No AI summary yet. Run AI analysis.</p>
            )}
            {sourceItem.topic_tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {sourceItem.topic_tags.map((tag) => (
                  <StatusPill className="bg-slate-100 text-slate-700 border-slate-200" key={tag} label={tag} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>{matches.length}</strong> client match(es)
            </p>
            <p>
              Top score: <strong>{Math.max(...matches.map((match) => match.relevance_score ?? 0), 0)}</strong>
            </p>
            <p>
              Action required: <strong>{matches.filter((match) => match.status === "Action required").length}</strong>
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Text</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {sourceItem.clean_text || sourceItem.raw_text || "No text available"}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-slate-600">
              No matches found yet. Add relevant watchlist terms, then re-run matching.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risk / Opportunity</TableHead>
                  <TableHead>Matched keywords</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Quick actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const clientInfo = readClientInfo(match.clients);
                  return (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{clientInfo.name || "Unknown client"}</p>
                          {clientInfo.industry ? <p className="text-xs text-slate-500">{clientInfo.industry}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>{match.relevance_score ?? "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-slate-700">
                          <p>Risk: {match.risk_level || "—"}</p>
                          <p>Opportunity: {match.opportunity_level || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md text-xs text-slate-700">
                        {(match.matched_keywords ?? []).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          className={CLIENT_MATCH_STATUS_STYLES[match.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                          label={match.status}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <form action={updateClientMatchStatusAction} className="flex gap-2">
                            <input name="matchId" type="hidden" value={match.id} />
                            <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                            <select
                              className="rounded-md border border-slate-300 p-2 text-xs"
                              defaultValue={match.status}
                              name="status"
                            >
                              {CLIENT_MATCH_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <Button size="sm" type="submit" variant="outline">
                              Save
                            </Button>
                          </form>
                          <form action={addClientMatchToReportAction}>
                            <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                            <input name="clientMatchId" type="hidden" value={match.id} />
                            <input name="clientId" type="hidden" value={match.client_id} />
                            <Button size="sm" type="submit" variant="outline">
                              Add to report
                            </Button>
                          </form>
                          <Button asChild size="sm" variant="ghost">
                            <a href={`#match-actions-${match.id}`}>More actions</a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {matches.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-slate-600 uppercase">Action Workspace</h2>
          {matches.map((match) => {
            const clientInfo = readClientInfo(match.clients);
            const reportOptions = reports.filter((report) => report.client_id === match.client_id);
            const drafts = aiOutputsByMatch.get(match.id);
            const meetingDraft = drafts?.meetingDraft;
            const clientUpdateDraft = drafts?.clientUpdateDraft;
            return (
              <Card id={`match-actions-${match.id}`} key={match.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {clientInfo.name || "Unknown client"} Action Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusPill
                      className={CLIENT_MATCH_STATUS_STYLES[match.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                      label={match.status}
                    />
                    <StatusPill className="bg-blue-100 text-blue-700 border-blue-200" label={`Score ${match.relevance_score ?? 0}`} />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <form action={createTaskFromIntelligenceAction} className="space-y-2 rounded-md border border-slate-200 p-3">
                      <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                      <input name="clientId" type="hidden" value={match.client_id} />
                      <p className="text-xs font-semibold text-slate-700 uppercase">Create task</p>
                      <Input name="title" placeholder="Task title" required />
                      <Textarea name="description" placeholder="Task description" rows={2} />
                      <select className="w-full rounded-md border border-slate-300 p-2 text-xs" name="stakeholderId">
                        <option value="">No stakeholder</option>
                        {stakeholders.map((stakeholder) => (
                          <option key={stakeholder.id} value={stakeholder.id}>
                            {stakeholder.full_name}
                          </option>
                        ))}
                      </select>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input name="owner" placeholder="Owner" />
                        <Input name="dueDate" type="date" />
                      </div>
                      <select className="w-full rounded-md border border-slate-300 p-2 text-xs" defaultValue="Medium" name="priority">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                      <Button className="w-full" size="sm" type="submit" variant="outline">
                        Create task
                      </Button>
                    </form>

                    <form action={linkStakeholderToIntelligenceAction} className="space-y-2 rounded-md border border-slate-200 p-3">
                      <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                      <input name="clientId" type="hidden" value={match.client_id} />
                      <p className="text-xs font-semibold text-slate-700 uppercase">Link stakeholder</p>
                      <select className="w-full rounded-md border border-slate-300 p-2 text-xs" name="stakeholderId" required>
                        <option value="">Select stakeholder</option>
                        {stakeholders.map((stakeholder) => (
                          <option key={stakeholder.id} value={stakeholder.id}>
                            {stakeholder.full_name}
                          </option>
                        ))}
                      </select>
                      <Textarea name="summary" placeholder="Link note (optional)" rows={3} />
                      <Button className="w-full" size="sm" type="submit" variant="outline">
                        Save stakeholder link
                      </Button>
                    </form>

                    <form action={addClientMatchToReportAction} className="space-y-2 rounded-md border border-slate-200 p-3">
                      <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                      <input name="clientMatchId" type="hidden" value={match.id} />
                      <input name="clientId" type="hidden" value={match.client_id} />
                      <p className="text-xs font-semibold text-slate-700 uppercase">Add to specific report</p>
                      <select className="w-full rounded-md border border-slate-300 p-2 text-xs" name="reportId">
                        <option value="">Auto-create or use latest draft</option>
                        {reportOptions.map((report) => (
                          <option key={report.id} value={report.id}>
                            {report.title}
                          </option>
                        ))}
                      </select>
                      <Button className="w-full" size="sm" type="submit" variant="outline">
                        Add to report
                      </Button>
                    </form>

                    <div className="space-y-2 rounded-md border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700 uppercase">Generate drafts</p>
                      <form action={generateClientUpdateFromIntelligenceAction} className="space-y-2">
                        <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                        <input name="clientMatchId" type="hidden" value={match.id} />
                        <Button className="w-full" size="sm" type="submit" variant="outline">
                          Generate client update paragraph
                        </Button>
                      </form>
                      <form action={generateMeetingRequestFromIntelligenceAction} className="space-y-2 border-t pt-2">
                        <input name="sourceItemId" type="hidden" value={sourceItem.id} />
                        <input name="clientMatchId" type="hidden" value={match.id} />
                        <select className="w-full rounded-md border border-slate-300 p-2 text-xs" name="stakeholderId" required>
                          <option value="">Select stakeholder</option>
                          {stakeholders.map((stakeholder) => (
                            <option key={stakeholder.id} value={stakeholder.id}>
                              {stakeholder.full_name}
                            </option>
                          ))}
                        </select>
                        <Input defaultValue="Policy and relationship check-in" name="purpose" />
                        <Input defaultValue="Discuss implications and confirm next engagement steps." name="ask" />
                        <Input defaultValue="30 minutes" name="meetingLength" />
                        <Button className="w-full" size="sm" type="submit" variant="outline">
                          Generate meeting request
                        </Button>
                      </form>
                    </div>
                  </div>

                  {(clientUpdateDraft || meetingDraft) && (
                    <div className="grid gap-3 xl:grid-cols-2">
                      {clientUpdateDraft ? (
                        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                          <p className="mb-1 font-semibold text-slate-600">Latest client update draft</p>
                          <p>
                            {readFirstStringFromJson(clientUpdateDraft.output_json, "update_paragraph") ||
                              clientUpdateDraft.output_text ||
                              "Draft available in AI outputs."}
                          </p>
                        </div>
                      ) : null}
                      {meetingDraft ? (
                        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                          <p className="mb-1 font-semibold text-slate-600">Latest meeting request draft</p>
                          <p>
                            {readFirstStringFromJson(meetingDraft.output_json, "subject")
                              ? `Subject: ${readFirstStringFromJson(meetingDraft.output_json, "subject")}`
                              : meetingDraft.output_text || "Draft available in AI outputs."}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked Tasks ({linkedTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {linkedTasks.length === 0 ? (
              <p className="text-sm text-slate-600">No tasks linked to this intelligence item yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedTasks.map((task) => {
                  const clientName = readClientName(task.clients);
                  const stakeholderName = readStakeholderName(task.stakeholders);
                  return (
                    <div className="rounded-md border border-slate-200 p-3" key={task.id}>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {clientName || "No client"}
                        {stakeholderName ? ` • ${stakeholderName}` : ""}
                        {task.due_date ? ` • due ${task.due_date}` : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Linked Stakeholders ({linkedInteractions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {linkedInteractions.length === 0 ? (
              <p className="text-sm text-slate-600">No stakeholder links logged for this intelligence item yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedInteractions.map((interaction) => {
                  const stakeholderName = readStakeholderName(interaction.stakeholders);
                  const clientName = readClientName(interaction.clients);
                  return (
                    <div className="rounded-md border border-slate-200 p-3" key={interaction.id}>
                      <p className="font-medium text-slate-900">{stakeholderName || "Unknown stakeholder"}</p>
                      <p className="text-xs text-slate-500">
                        {interaction.interaction_type}
                        {clientName ? ` • ${clientName}` : ""}
                        {interaction.interaction_date ? ` • ${interaction.interaction_date}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{interaction.summary || "No summary."}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
