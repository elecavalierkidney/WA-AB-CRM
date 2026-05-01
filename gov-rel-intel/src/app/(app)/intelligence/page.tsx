import Link from "next/link";
import { BellDot, FilePlus2, Filter, RadioTower, Sparkles, Target } from "lucide-react";

import { createSourceItemAction, rerunMatchingAction, updateClientMatchStatusAction } from "@/app/(app)/intelligence/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CLIENT_MATCH_STATUSES, CLIENT_MATCH_STATUS_STYLES, SOURCE_TYPES, SOURCE_TYPE_STYLES } from "@/lib/constants";
import { listClients, listIntelligenceMatches, listSourceItems } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    clientId?: string;
    sourceType?: string;
    status?: string;
    minScore?: string;
    maxScore?: string;
    topic?: string;
    dateFrom?: string;
    dateTo?: string;
    actionRequiredOnly?: string;
    query?: string;
  }>;
}

function readName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string } | undefined)?.name;
  }

  return (relation as { name?: string } | null)?.name;
}

function readSource(
  relation: unknown,
): {
  title?: string;
  source_type?: string;
  source_name?: string;
  published_date?: string;
  url?: string;
  summary?: string;
  topic_tags?: string[];
} {
  type SourceInfo = {
    title?: string;
    source_type?: string;
    source_name?: string;
    published_date?: string;
    url?: string;
    summary?: string;
    topic_tags?: string[];
  };

  if (Array.isArray(relation)) {
    return (relation[0] as SourceInfo | undefined) ?? {};
  }

  return (relation as SourceInfo | null) ?? {};
}

export default async function IntelligencePage({ searchParams }: PageProps) {
  const rawFilters = await searchParams;
  const minScore = rawFilters.minScore ? Number(rawFilters.minScore) : undefined;
  const maxScore = rawFilters.maxScore ? Number(rawFilters.maxScore) : undefined;
  const filters = {
    clientId: rawFilters.clientId || undefined,
    sourceType: rawFilters.sourceType || undefined,
    status: rawFilters.status || undefined,
    minScore: Number.isFinite(minScore) ? minScore : undefined,
    maxScore: Number.isFinite(maxScore) ? maxScore : undefined,
    topic: rawFilters.topic || undefined,
    dateFrom: rawFilters.dateFrom || undefined,
    dateTo: rawFilters.dateTo || undefined,
    actionRequiredOnly: rawFilters.actionRequiredOnly === "true",
    query: rawFilters.query || undefined,
  };

  const [clients, sourceItems, matches] = await Promise.all([
    listClients(),
    listSourceItems(),
    listIntelligenceMatches(filters),
  ]);
  const highRelevanceCount = matches.filter((match) => (match.relevance_score ?? 0) >= 75).length;
  const actionRequiredCount = matches.filter((match) => match.status === "Action required").length;
  const newMatchCount = matches.filter((match) => match.status === "New").length;
  const topics = Array.from(
    new Set(
      matches.flatMap((match) => {
        const source = readSource(match.source_items);
        return source.topic_tags ?? [];
      }),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligence feed"
        description="Ingest source items, run keyword-based client matching, and triage relevance."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Source items</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{sourceItems.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <RadioTower className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Matched items</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{matches.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <Target className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">High relevance</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{highRelevanceCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Action required</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{actionRequiredCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700">
              <BellDot className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(22rem,0.9fr)_2fr]">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <FilePlus2 className="h-4 w-4 text-emerald-700" />
              Add source item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSourceItemAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Alberta announces healthcare procurement update" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="sourceType">Source type</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="sourceType" name="sourceType">
                    {SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourceName">Source name</Label>
                  <Input id="sourceName" name="sourceName" placeholder="Government of Alberta" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="url">Source URL</Label>
                  <Input id="url" name="url" placeholder="https://www.alberta.ca/news-release" type="url" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="publishedDate">Published date</Label>
                  <Input id="publishedDate" name="publishedDate" type="date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ministry">Ministry (optional)</Label>
                <Input id="ministry" name="ministry" placeholder="Health" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rawText">Raw source text</Label>
                <Textarea id="rawText" name="rawText" required rows={7} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cleanText">Clean text override (optional)</Label>
                <Textarea id="cleanText" name="cleanText" rows={4} />
              </div>
              <Button className="w-full" type="submit">
                Save and run AI analysis
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Source items</CardTitle>
            <p className="text-sm text-slate-600">{sourceItems.length} items in the monitoring feed</p>
          </CardHeader>
          <CardContent>
            {sourceItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No source items yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Source type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Matches</TableHead>
                      <TableHead>Top score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="min-w-64">
                            <Link className="font-semibold text-slate-950 hover:underline" href={`/intelligence/${item.id}`}>
                              {item.title}
                            </Link>
                            <p className="text-xs text-slate-500">{item.source_name || "Unknown source"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            className={SOURCE_TYPE_STYLES[item.source_type] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                            label={item.source_type}
                          />
                        </TableCell>
                        <TableCell>{item.published_date || "—"}</TableCell>
                        <TableCell>{item.matchesCount}</TableCell>
                        <TableCell>{item.topRelevance}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/intelligence/${item.id}`}>Open</Link>
                            </Button>
                            <form action={rerunMatchingAction}>
                              <input name="sourceItemId" type="hidden" value={item.id} />
                              <Button size="sm" type="submit" variant="ghost">
                                Re-run AI
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

      <section className="space-y-3">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Filter className="h-4 w-4 text-slate-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 lg:grid-cols-4" method="get">
              <Input defaultValue={rawFilters.query || ""} name="query" placeholder="Search title or matched keyword" />
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={rawFilters.clientId || ""}
                name="clientId"
              >
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={rawFilters.sourceType || ""}
                name="sourceType"
              >
                <option value="">All source types</option>
                {SOURCE_TYPES.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {sourceType}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={rawFilters.topic || ""}
                name="topic"
              >
                <option value="">All topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={rawFilters.status || ""}
                name="status"
              >
                <option value="">All statuses</option>
                {CLIENT_MATCH_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Input defaultValue={rawFilters.dateFrom || ""} name="dateFrom" type="date" />
              <Input defaultValue={rawFilters.dateTo || ""} name="dateTo" type="date" />
              <div className="flex gap-2">
                <Input
                  defaultValue={rawFilters.minScore || ""}
                  min={0}
                  max={100}
                  name="minScore"
                  placeholder="Min score"
                  type="number"
                />
                <Input
                  defaultValue={rawFilters.maxScore || ""}
                  min={0}
                  max={100}
                  name="maxScore"
                  placeholder="Max score"
                  type="number"
                />
              </div>
              <div className="flex items-center gap-2 rounded-md border border-slate-300 p-2">
                <input
                  defaultChecked={rawFilters.actionRequiredOnly === "true"}
                  id="actionRequiredOnly"
                  name="actionRequiredOnly"
                  type="checkbox"
                  value="true"
                />
                <Label className="text-sm text-slate-700" htmlFor="actionRequiredOnly">
                  Action required only
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="outline">
                  Apply
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/intelligence">Reset</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Matched intelligence</CardTitle>
            <p className="text-sm text-slate-600">
              {matches.length} visible matches, {newMatchCount} new, {actionRequiredCount} action required.
            </p>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No matched items for the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source item</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Matched keywords</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.map((match) => {
                      const source = readSource(match.source_items);
                      const clientName = readName(match.clients) ?? "Unknown client";
                      return (
                        <TableRow key={match.id}>
                          <TableCell>
                            <div className="min-w-80">
                              <Link className="font-semibold text-slate-950 hover:underline" href={`/intelligence/${match.source_item_id}`}>
                                {source.title ?? "Untitled source"}
                              </Link>
                            <div className="mt-1 flex gap-2 text-xs text-slate-500">
                                <span>{source.published_date || "No date"}</span>
                                <span>|</span>
                                <span>{source.source_name || source.source_type || "Unknown source"}</span>
                              </div>
                              {source.summary ? (
                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{source.summary}</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{clientName}</TableCell>
                          <TableCell>
                            <StatusPill
                              className={
                                (match.relevance_score ?? 0) >= 75
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              }
                              label={`${match.relevance_score ?? 0}`}
                            />
                          </TableCell>
                          <TableCell className="max-w-56 text-xs text-slate-600">
                            {(match.matched_keywords ?? []).join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            <StatusPill
                              className={CLIENT_MATCH_STATUS_STYLES[match.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                              label={match.status}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <form action={updateClientMatchStatusAction} className="flex justify-end gap-2">
                              <input name="matchId" type="hidden" value={match.id} />
                              <input name="sourceItemId" type="hidden" value={match.source_item_id} />
                              <select className="rounded-md border border-slate-300 p-2 text-xs" defaultValue={match.status} name="status">
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
