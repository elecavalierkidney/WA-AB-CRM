import Link from "next/link";
import { BellDot, BriefcaseBusiness, CalendarClock, ClipboardList, RadioTower } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { TASK_PRIORITY_STYLES, TASK_STATUS_STYLES } from "@/lib/constants";
import { getDashboardStats, getRecentOpenTasks, getRecentStakeholders, getRecentlyReviewedIntelligence } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

const statItems = [
  {
    key: "activeClients",
    title: "Active clients",
    description: "Live client files",
    href: "/clients",
    icon: BriefcaseBusiness,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    key: "openTasks",
    title: "Open tasks",
    description: "Follow-up workload",
    href: "/tasks",
    icon: ClipboardList,
    accent: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    key: "newIntelligenceItems",
    title: "New intelligence",
    description: "Unreviewed matches",
    href: "/intelligence",
    icon: BellDot,
    accent: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    key: "highRelevanceItems",
    title: "High relevance",
    description: "Score 75+",
    href: "/intelligence",
    icon: RadioTower,
    accent: "border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    key: "followUpsDueThisWeek",
    title: "Due this week",
    description: "Time-sensitive items",
    href: "/tasks",
    icon: CalendarClock,
    accent: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
] as const;

function StatCard({
  title,
  value,
  description,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: typeof BriefcaseBusiness;
  accent: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-1">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-slate-950">{value}</p>
        </CardContent>
      </Card>
    </Link>
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
        {statItems.map((item) => (
          <StatCard
            accent={item.accent}
            description={item.description}
            href={item.href}
            icon={item.icon}
            key={item.key}
            title={item.title}
            value={stats[item.key]}
          />
        ))}
      </section>

      <section>
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Recent open tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No open tasks yet. Create one on the Tasks page.
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const clientName = getClientName(task.clients);
                  return (
                  <div
                    className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                    key={task.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-950">{task.title}</p>
                      <p className="text-sm text-slate-600">
                        {clientName ?? "No client linked"}
                        {task.due_date ? ` | due ${task.due_date}` : " | no due date"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
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
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Recently added stakeholders</CardTitle>
          </CardHeader>
          <CardContent>
            {stakeholders.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No stakeholders added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {stakeholders.map((stakeholder) => (
                  <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3" key={stakeholder.id}>
                    <p className="font-medium text-slate-950">{stakeholder.full_name}</p>
                    <p className="text-sm text-slate-600">
                      {stakeholder.title || "No title"}
                      {stakeholder.organization ? ` | ${stakeholder.organization}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {stakeholder.stakeholder_type || "Other"}
                      {stakeholder.ministry ? ` | ${stakeholder.ministry}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Recently reviewed intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewedIntelligence.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No reviewed intelligence yet.
              </p>
            ) : (
              <div className="space-y-3">
                {reviewedIntelligence.map((match) => {
                  const source = getSourceInfo(match.source_items);
                  return (
                    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3" key={match.id}>
                      <p className="font-medium text-slate-950">{source.title || "Untitled source"}</p>
                      <p className="text-sm text-slate-600">
                        {getName(match.clients) || "Unknown client"}
                        {source.published_date ? ` | ${source.published_date}` : ""}
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
