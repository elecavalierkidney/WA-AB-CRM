import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardList, Filter, Plus, Siren } from "lucide-react";

import { createTaskAction, setTaskStatusAction } from "@/app/(app)/tasks/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { OPEN_TASK_STATUSES, TASK_PRIORITY_STYLES, TASK_STATUS_STYLES } from "@/lib/constants";
import { listClients, listSourceItems, listStakeholders, listTasks } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    clientId?: string;
    stakeholderId?: string;
    sourceItemId?: string;
    owner?: string;
    priority?: string;
    status?: string;
    due?: "overdue" | "week" | "unscheduled";
  }>;
}

function TaskStatusForm({ id, status }: { id: string; status: string }) {
  return (
    <form action={setTaskStatusAction} className="flex items-center gap-2">
      <input name="id" type="hidden" value={id} />
      <select
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        defaultValue={status}
        name="status"
      >
        <option value="Not started">Not started</option>
        <option value="In progress">In progress</option>
        <option value="Waiting">Waiting</option>
        <option value="Complete">Complete</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <Button size="sm" type="submit" variant="outline">
        Update
      </Button>
    </form>
  );
}

function getClientName(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { name?: string } | undefined)?.name;
  }

  return (related as { name?: string } | null)?.name;
}

function getStakeholderName(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { full_name?: string } | undefined)?.full_name;
  }

  return (related as { full_name?: string } | null)?.full_name;
}

function getSourceTitle(related: unknown) {
  if (Array.isArray(related)) {
    return (related[0] as { title?: string } | undefined)?.title;
  }

  return (related as { title?: string } | null)?.title;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const rawFilters = await searchParams;
  const filters = {
    query: rawFilters.query || undefined,
    clientId: rawFilters.clientId || undefined,
    stakeholderId: rawFilters.stakeholderId || undefined,
    sourceItemId: rawFilters.sourceItemId || undefined,
    owner: rawFilters.owner || undefined,
    priority: rawFilters.priority || undefined,
    status: rawFilters.status || "open",
    due: rawFilters.due || undefined,
  };
  const [tasks, clients, stakeholders, sourceItems] = await Promise.all([
    listTasks(filters),
    listClients(),
    listStakeholders({ active: "active" }),
    listSourceItems(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const openCount = tasks.filter((task) => OPEN_TASK_STATUSES.includes(task.status as (typeof OPEN_TASK_STATUSES)[number])).length;
  const overdueCount = tasks.filter((task) => task.due_date && task.due_date < today && task.status !== "Complete").length;
  const urgentCount = tasks.filter((task) => task.priority === "Urgent").length;
  const completeCount = tasks.filter((task) => task.status === "Complete").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track follow-up actions tied to client files and intelligence items."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Visible tasks</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{tasks.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Open</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{openCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-700">
              <CalendarClock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Overdue</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{overdueCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-700">
              <Siren className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Complete</p>
              <p className="mt-1 text-3xl font-semibold text-slate-950">{completeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.85fr)_2fr]">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Plus className="h-4 w-4 text-emerald-700" />
              Create task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTaskAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="title">Task title</Label>
                <Input id="title" name="title" placeholder="Prepare client briefing note" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
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
                <Label htmlFor="stakeholderId">Stakeholder</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="stakeholderId" name="stakeholderId">
                  <option value="">No stakeholder</option>
                  {stakeholders.map((stakeholder) => (
                    <option key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sourceItemId">Source item</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="sourceItemId" name="sourceItemId">
                  <option value="">No source item</option>
                  {sourceItems.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="owner">Owner</Label>
                  <Input id="owner" name="owner" placeholder="Ethan" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dueDate">Due date</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="priority">Priority</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="priority" name="priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="status" name="status">
                    <option value="Not started">Not started</option>
                    <option value="In progress">In progress</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Complete">Complete</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <Button className="w-full" type="submit">
                Save task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-semibold text-slate-950">Task queue</CardTitle>
            <p className="text-sm text-slate-600">
              {tasks.length} visible tasks, {urgentCount} urgent.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-3 xl:grid-cols-4" method="get">
              <div className="flex items-center gap-2 xl:col-span-4">
                <Filter className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-900">Filters</p>
              </div>
              <Input defaultValue={rawFilters.query || ""} name="query" placeholder="Search title, owner, linked record" />
              <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={filters.status} name="status">
                <option value="open">Open statuses</option>
                <option value="all">All statuses</option>
                <option value="Not started">Not started</option>
                <option value="In progress">In progress</option>
                <option value="Waiting">Waiting</option>
                <option value="Complete">Complete</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={filters.priority || ""} name="priority">
                <option value="">All priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={filters.due || ""} name="due">
                <option value="">Any due date</option>
                <option value="overdue">Overdue</option>
                <option value="week">Due this week</option>
                <option value="unscheduled">Unscheduled</option>
              </select>
              <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue={filters.clientId || ""} name="clientId">
                <option value="">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.stakeholderId || ""}
                name="stakeholderId"
              >
                <option value="">All stakeholders</option>
                {stakeholders.map((stakeholder) => (
                  <option key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.full_name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue={filters.sourceItemId || ""}
                name="sourceItemId"
              >
                <option value="">All source items</option>
                {sourceItems.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.title}
                  </option>
                ))}
              </select>
              <Input defaultValue={rawFilters.owner || ""} name="owner" placeholder="Owner contains..." />
              <div className="flex gap-2">
                <Button type="submit" variant="outline">
                  Apply
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/tasks">Reset</Link>
                </Button>
              </div>
            </form>

            {tasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                No tasks found for the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Stakeholder</TableHead>
                      <TableHead>Source item</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="min-w-64">
                            <p className="font-semibold text-slate-950">{task.title}</p>
                            {task.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p> : null}
                          </div>
                        </TableCell>
                        <TableCell>{getClientName(task.clients) || "—"}</TableCell>
                        <TableCell>{getStakeholderName(task.stakeholders) || "—"}</TableCell>
                        <TableCell>
                          <p className="line-clamp-2 min-w-48 text-xs text-slate-600">{getSourceTitle(task.source_items) || "—"}</p>
                        </TableCell>
                        <TableCell>{task.owner || "—"}</TableCell>
                        <TableCell>
                          {task.due_date ? (
                            <StatusPill
                              className={
                                task.due_date < today && task.status !== "Complete"
                                  ? "border-rose-200 bg-rose-50 text-rose-700"
                                  : "border-slate-200 bg-slate-100 text-slate-700"
                              }
                              label={task.due_date}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            className={TASK_PRIORITY_STYLES[task.priority] ?? "bg-slate-100 text-slate-700"}
                            label={task.priority}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            className={TASK_STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700"}
                            label={task.status}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <TaskStatusForm id={task.id} status={task.status} />
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
