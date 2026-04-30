import { createTaskAction, setTaskStatusAction } from "@/app/(app)/tasks/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITY_STYLES, TASK_STATUS_STYLES } from "@/lib/constants";
import { listClients, listOpenTasks, listSourceItems, listStakeholders } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

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

export default async function TasksPage() {
  const [tasks, clients, stakeholders, sourceItems] = await Promise.all([
    listOpenTasks(),
    listClients(),
    listStakeholders({ active: "active" }),
    listSourceItems(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track follow-up actions tied to client files and intelligence items."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Task</CardTitle>
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
                    <option defaultChecked value="Medium">
                      Medium
                    </option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="status" name="status">
                    <option defaultChecked value="Not started">
                      Not started
                    </option>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-600">No open tasks yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Source item</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{getClientName(task.clients) || "—"}</TableCell>
                      <TableCell>
                        {Array.isArray(task.stakeholders) ? task.stakeholders[0]?.full_name || "—" : task.stakeholders?.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        {Array.isArray(task.source_items) ? task.source_items[0]?.title || "—" : task.source_items?.title || "—"}
                      </TableCell>
                      <TableCell>{task.due_date || "—"}</TableCell>
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
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
