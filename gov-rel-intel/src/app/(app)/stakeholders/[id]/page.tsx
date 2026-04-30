import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createInteractionAction,
  createStakeholderTaskAction,
  deleteRelationshipAction,
  setStakeholderActiveAction,
  updateStakeholderAction,
  upsertRelationshipAction,
} from "@/app/(app)/stakeholders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  INTERACTION_TYPES,
  POSITION_ON_ISSUE_VALUES,
  RELATIONSHIP_STRENGTH_STYLES,
  RELATIONSHIP_STRENGTHS,
  STAKEHOLDER_TYPES,
  STRATEGIC_VALUES,
  TASK_PRIORITY_STYLES,
  TASK_STATUS_STYLES,
} from "@/lib/constants";
import {
  getStakeholderById,
  listClients,
  listInteractionsByStakeholder,
  listOpenTasksByStakeholder,
  listSourceItems,
  listStakeholderRelationshipsByStakeholder,
} from "@/lib/server/queries";

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

function readSourceInfo(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { title?: string } | undefined) ?? {};
  }
  return (relation as { title?: string } | null) ?? {};
}

function readClientName(relation: unknown) {
  if (Array.isArray(relation)) {
    return (relation[0] as { name?: string } | undefined)?.name;
  }
  return (relation as { name?: string } | null)?.name;
}

export default async function StakeholderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [stakeholder, clients, relationships, interactions, openTasks, sources] = await Promise.all([
    getStakeholderById(id),
    listClients(),
    listStakeholderRelationshipsByStakeholder(id),
    listInteractionsByStakeholder(id),
    listOpenTasksByStakeholder(id),
    listSourceItems(),
  ]);

  if (!stakeholder) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={stakeholder.full_name}
        description="Stakeholder profile, client relationships, interactions, and follow-up actions."
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/stakeholders">Back to stakeholders</Link>
            </Button>
            <form action={setStakeholderActiveAction}>
              <input name="id" type="hidden" value={stakeholder.id} />
              <input name="active" type="hidden" value={stakeholder.active ? "false" : "true"} />
              <Button size="sm" type="submit" variant="outline">
                {stakeholder.active ? "Archive stakeholder" : "Activate stakeholder"}
              </Button>
            </form>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateStakeholderAction} className="space-y-3">
              <input name="id" type="hidden" value={stakeholder.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName">First name</Label>
                  <Input defaultValue={stakeholder.first_name || ""} id="firstName" name="firstName" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input defaultValue={stakeholder.last_name || ""} id="lastName" name="lastName" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Full name</Label>
                <Input defaultValue={stakeholder.full_name} id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="title">Title</Label>
                  <Input defaultValue={stakeholder.title || ""} id="title" name="title" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stakeholderType">Stakeholder type</Label>
                  <select
                    className="w-full rounded-md border border-slate-300 p-2 text-sm"
                    defaultValue={stakeholder.stakeholder_type || ""}
                    id="stakeholderType"
                    name="stakeholderType"
                  >
                    <option value="">Select type</option>
                    {STAKEHOLDER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="organization">Organization</Label>
                  <Input defaultValue={stakeholder.organization || ""} id="organization" name="organization" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ministry">Ministry</Label>
                  <Input defaultValue={stakeholder.ministry || ""} id="ministry" name="ministry" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="riding">Riding</Label>
                  <Input defaultValue={stakeholder.riding || ""} id="riding" name="riding" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input defaultValue={stakeholder.phone || ""} id="phone" name="phone" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input defaultValue={stakeholder.email || ""} id="email" name="email" type="email" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                  <Input defaultValue={stakeholder.linkedin_url || ""} id="linkedinUrl" name="linkedinUrl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input defaultValue={stakeholder.website_url || ""} id="websiteUrl" name="websiteUrl" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bio">Bio</Label>
                <Textarea defaultValue={stakeholder.bio || ""} id="bio" name="bio" rows={4} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea defaultValue={stakeholder.notes || ""} id="notes" name="notes" rows={4} />
              </div>
              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Follow-Up Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createStakeholderTaskAction} className="space-y-3">
              <input name="stakeholderId" type="hidden" value={stakeholder.id} />
              <div className="space-y-1">
                <Label htmlFor="taskClientId">Client</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="taskClientId" name="clientId">
                  <option value="">No client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="taskTitle">Task title</Label>
                <Input id="taskTitle" name="title" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea id="taskDescription" name="description" rows={3} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="taskDueDate">Due date</Label>
                  <Input id="taskDueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="taskOwner">Owner</Label>
                  <Input id="taskOwner" name="owner" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="taskPriority">Priority</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Medium" id="taskPriority" name="priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <Button className="w-full" type="submit">
                Create task
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Relationships ({relationships.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={upsertRelationshipAction} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-3">
            <input name="stakeholderId" type="hidden" value={stakeholder.id} />
            <div className="space-y-1">
              <Label htmlFor="clientId">Client</Label>
              <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="clientId" name="clientId" required>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="relationshipStrength">Relationship strength</Label>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue="Unknown"
                id="relationshipStrength"
                name="relationshipStrength"
              >
                {RELATIONSHIP_STRENGTHS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="strategicValue">Strategic value</Label>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue="Medium"
                id="strategicValue"
                name="strategicValue"
              >
                {STRATEGIC_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="positionOnIssue">Position on issue</Label>
              <select
                className="w-full rounded-md border border-slate-300 p-2 text-sm"
                defaultValue="Unknown"
                id="positionOnIssue"
                name="positionOnIssue"
              >
                {POSITION_ON_ISSUE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="relationshipOwner">Owner</Label>
              <Input id="relationshipOwner" name="relationshipOwner" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nextFollowUpDate">Next follow-up</Label>
              <Input id="nextFollowUpDate" name="nextFollowUpDate" type="date" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="engagementAngle">Engagement angle</Label>
              <Input id="engagementAngle" name="engagementAngle" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="relationshipNotes">Notes</Label>
              <Textarea id="relationshipNotes" name="notes" rows={2} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit">Add relationship</Button>
            </div>
          </form>

          {relationships.length === 0 ? (
            <p className="text-sm text-slate-600">No client relationships mapped yet.</p>
          ) : (
            <div className="space-y-3">
              {relationships.map((relationship) => {
                const clientInfo = readClientInfo(relationship.clients);
                return (
                  <details className="rounded-md border border-slate-200 p-3" key={relationship.id}>
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{clientInfo.name || "Unknown client"}</p>
                          <p className="text-xs text-slate-500">{clientInfo.industry || "No industry set"}</p>
                        </div>
                        <div className="flex gap-2">
                          <StatusPill
                            className={RELATIONSHIP_STRENGTH_STYLES[relationship.relationship_strength] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                            label={relationship.relationship_strength}
                          />
                          <StatusPill
                            className="bg-slate-100 text-slate-700 border-slate-200"
                            label={relationship.strategic_value}
                          />
                        </div>
                      </div>
                    </summary>
                    <form action={upsertRelationshipAction} className="mt-3 grid gap-3 border-t pt-3 md:grid-cols-3">
                      <input name="relationshipId" type="hidden" value={relationship.id} />
                      <input name="stakeholderId" type="hidden" value={stakeholder.id} />
                      <input name="clientId" type="hidden" value={relationship.client_id} />
                      <div className="space-y-1">
                        <Label>Relationship strength</Label>
                        <select
                          className="w-full rounded-md border border-slate-300 p-2 text-sm"
                          defaultValue={relationship.relationship_strength}
                          name="relationshipStrength"
                        >
                          {RELATIONSHIP_STRENGTHS.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Strategic value</Label>
                        <select
                          className="w-full rounded-md border border-slate-300 p-2 text-sm"
                          defaultValue={relationship.strategic_value}
                          name="strategicValue"
                        >
                          {STRATEGIC_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Position on issue</Label>
                        <select
                          className="w-full rounded-md border border-slate-300 p-2 text-sm"
                          defaultValue={relationship.position_on_issue}
                          name="positionOnIssue"
                        >
                          {POSITION_ON_ISSUE_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Owner</Label>
                        <Input defaultValue={relationship.relationship_owner || ""} name="relationshipOwner" />
                      </div>
                      <div className="space-y-1">
                        <Label>Last contact</Label>
                        <Input defaultValue={relationship.last_contact_date || ""} name="lastContactDate" type="date" />
                      </div>
                      <div className="space-y-1">
                        <Label>Next follow-up</Label>
                        <Input defaultValue={relationship.next_follow_up_date || ""} name="nextFollowUpDate" type="date" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label>Known interests</Label>
                        <Input defaultValue={relationship.known_interests || ""} name="knownInterests" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label>Known sensitivities</Label>
                        <Input defaultValue={relationship.known_sensitivities || ""} name="knownSensitivities" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label>Engagement angle</Label>
                        <Input defaultValue={relationship.engagement_angle || ""} name="engagementAngle" />
                      </div>
                      <div className="space-y-1 md:col-span-3">
                        <Label>Notes</Label>
                        <Textarea defaultValue={relationship.notes || ""} name="notes" rows={2} />
                      </div>
                      <div className="flex gap-2 md:col-span-3">
                        <Button size="sm" type="submit">
                          Save
                        </Button>
                        <Button formAction={deleteRelationshipAction} size="sm" type="submit" variant="ghost">
                          Remove
                        </Button>
                      </div>
                    </form>
                  </details>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log Interaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInteractionAction} className="space-y-3">
              <input name="stakeholderId" type="hidden" value={stakeholder.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="interactionClientId">Client</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="interactionClientId" name="clientId">
                    <option value="">No client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="interactionType">Interaction type</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="interactionType" name="interactionType">
                    {INTERACTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="interactionDate">Date</Label>
                  <Input id="interactionDate" name="interactionDate" required type="date" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="interactionSourceItemId">Related source item</Label>
                  <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="interactionSourceItemId" name="sourceItemId">
                    <option value="">None</option>
                    {sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" rows={2} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="attendees">Attendees</Label>
                <Input id="attendees" name="attendees" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="outcome">Outcome</Label>
                <Textarea id="outcome" name="outcome" rows={2} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input className="h-4 w-4" name="followUpRequired" type="checkbox" />
                  Follow-up required
                </label>
                <div className="space-y-1">
                  <Label htmlFor="followUpDeadline">Follow-up deadline</Label>
                  <Input id="followUpDeadline" name="followUpDeadline" type="date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="interactionNotes">Notes</Label>
                <Textarea id="interactionNotes" name="notes" rows={2} />
              </div>

              <div className="rounded-md border border-slate-200 p-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input className="h-4 w-4" name="createTask" type="checkbox" />
                  Create task from this interaction
                </label>
                <div className="mt-2 space-y-2">
                  <Input name="taskTitle" placeholder="Task title" />
                  <Textarea name="taskDescription" placeholder="Task description" rows={2} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input name="taskOwner" placeholder="Task owner" />
                    <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Medium" name="taskPriority">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button className="w-full" type="submit">
                Save interaction
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Tasks ({openTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {openTasks.length === 0 ? (
                <p className="text-sm text-slate-600">No open tasks linked to this stakeholder.</p>
              ) : (
                <div className="space-y-2">
                  {openTasks.map((task) => (
                    <div className="rounded-md border border-slate-200 p-3" key={task.id}>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {readClientName(task.clients) || "No client"}
                        {task.due_date ? ` • due ${task.due_date}` : ""}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <StatusPill
                          className={TASK_PRIORITY_STYLES[task.priority] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                          label={task.priority}
                        />
                        <StatusPill
                          className={TASK_STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                          label={task.status}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interaction History ({interactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-sm text-slate-600">No interactions logged yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Follow-up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {interactions.map((interaction) => {
                      const clientInfo = readClientInfo(interaction.clients);
                      const sourceInfo = readSourceInfo(interaction.source_items);
                      return (
                        <TableRow key={interaction.id}>
                          <TableCell>{interaction.interaction_date}</TableCell>
                          <TableCell>{interaction.interaction_type}</TableCell>
                          <TableCell>{clientInfo.name || "—"}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-slate-800">{interaction.summary || "—"}</p>
                              {sourceInfo.title ? <p className="text-xs text-slate-500">Source: {sourceInfo.title}</p> : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {interaction.follow_up_required ? (
                              <StatusPill
                                className="bg-amber-100 text-amber-800 border-amber-200"
                                label={interaction.follow_up_deadline ? `Due ${interaction.follow_up_deadline}` : "Required"}
                              />
                            ) : (
                              <StatusPill className="bg-slate-100 text-slate-700 border-slate-200" label="None" />
                            )}
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
      </section>
    </div>
  );
}
