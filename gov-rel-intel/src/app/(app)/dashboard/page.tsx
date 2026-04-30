import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { TASK_PRIORITY_STYLES, TASK_STATUS_STYLES } from "@/lib/constants";
import { getDashboardStats, getRecentOpenTasks, getRecentStakeholders, getRecentlyReviewedIntelligence } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function getClientName(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { name?: string } | undefined)?.name;
  }

  return (related as { name?: string } | null)?.name;
}

function getName(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { name?: string } | undefined)?.name;
  }

  return (related as { name?: string } | null)?.name;
}

function getSourceInfo(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { title?: string; published_date?: string; source_type?: string } | undefined) ?? {};
  }

  return (related as { title?: string; published_date?: string; source_type?: string } | null) ?? {};
}

export default async function DashboardPage() {
  const [stats, tasks, stakeholders, reviewedIntelligence] = await Promise.all([
    getDashboardStats(),
    getRecentOpenTasks(),
    getRecentStakeholders(),
    getRecentlyReviewedIntelligence(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live snapshot of client monitoring workload and follow-up priorities."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active Clients" value={stats.activeClients} />
        <StatCard title="Open Tasks" value={stats.openTasks} />
        <StatCard title="New Intelligence Items" value={stats.newIntelligenceItems} />
        <StatCard title="High-Relevance Matches" value={stats.highRelevanceItems} />
        <StatCard title="Follow-Ups Due This Week" value={stats.followUpsDueThisWeek} />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Open Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-600">No open tasks yet. Create one on the Tasks page.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const clientName = getClientName(task.clients);
                  return (
                  <div
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={task.id}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-600">
                        {clientName ?? "No client linked"}
                        {task.due_date ? ` • due ${task.due_date}` : " • no due date"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <StatusPill
                        className={TASK_PRIORITY_STYLES[task.priority] ?? "bg-slate-100 text-slate-700"}
                        label={task.priority}
                      />
                      <StatusPill
                        className={TASK_STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700"}
                        label={task.status}
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recently Added Stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            {stakeholders.length === 0 ? (
              <p className="text-sm text-slate-600">No stakeholders added yet.</p>
            ) : (
              <div className="space-y-3">
                {stakeholders.map((stakeholder) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-3" key={stakeholder.id}>
                    <p className="font-medium text-slate-900">{stakeholder.full_name}</p>
                    <p className="text-sm text-slate-600">
                      {stakeholder.title || "No title"}
                      {stakeholder.organization ? ` • ${stakeholder.organization}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {stakeholder.stakeholder_type || "Other"}
                      {stakeholder.ministry ? ` • ${stakeholder.ministry}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recently Reviewed Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedIntelligence.length === 0 ? (
              <p className="text-sm text-slate-600">No reviewed intelligence yet.</p>
            ) : (
              <div className="space-y-3">
                {reviewedIntelligence.map((match) => {
                  const source = getSourceInfo(match.source_items);
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3" key={match.id}>
                      <p className="font-medium text-slate-900">{source.title || "Untitled source"}</p>
                      <p className="text-sm text-slate-600">
                        {getName(match.clients) || "Unknown client"}
                        {source.published_date ? ` • ${source.published_date}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill className="bg-slate-100 text-slate-700 border-slate-200" label={match.status} />
                        <StatusPill className="bg-blue-100 text-blue-700 border-blue-200" label={`Score ${match.relevance_score ?? 0}`} />
                        {source.source_type ? (
                          <StatusPill className="bg-slate-100 text-slate-700 border-slate-200" label={source.source_type} />
                        ) : null}
                      </div>
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
