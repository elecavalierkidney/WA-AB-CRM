import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteRelationshipAction, upsertRelationshipAction } from "@/app/(app)/stakeholders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { POSITION_ON_ISSUE_VALUES, RELATIONSHIP_STRENGTH_STYLES, RELATIONSHIP_STRENGTHS, STRATEGIC_VALUES } from "@/lib/constants";
import {
  getClientById,
  listStakeholderRelationshipsByClient,
  listStakeholders,
} from "@/lib/server/queries";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function readStakeholderInfo(relation: unknown) {
  if (Array.isArray(relation)) {
    return (
      (relation[0] as {
        full_name?: string;
        title?: string;
        organization?: string;
        stakeholder_type?: string;
      } | undefined) ?? {}
    );
  }
  return (
    (relation as {
      full_name?: string;
      title?: string;
      organization?: string;
      stakeholder_type?: string;
    } | null) ?? {}
  );
}

export default async function ClientStakeholdersPage({ params }: PageProps) {
  const { id } = await params;
  const [client, relationships, stakeholders] = await Promise.all([
    getClientById(id),
    listStakeholderRelationshipsByClient(id),
    listStakeholders({ active: "active" }),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${client.name} Stakeholders`}
        description="Map stakeholder relationships for this client file and track follow-up priorities."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/clients/${id}`}>Back to client</Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link Stakeholder</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertRelationshipAction} className="space-y-3">
              <input name="clientId" type="hidden" value={id} />
              <div className="space-y-1">
                <Label htmlFor="stakeholderId">Stakeholder</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" id="stakeholderId" name="stakeholderId" required>
                  <option value="">Select stakeholder</option>
                  {stakeholders.map((stakeholder) => (
                    <option key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="relationshipStrength">Relationship strength</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Unknown" id="relationshipStrength" name="relationshipStrength">
                  {RELATIONSHIP_STRENGTHS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="strategicValue">Strategic value</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Medium" id="strategicValue" name="strategicValue">
                  {STRATEGIC_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="positionOnIssue">Position on issue</Label>
                <select className="w-full rounded-md border border-slate-300 p-2 text-sm" defaultValue="Unknown" id="positionOnIssue" name="positionOnIssue">
                  {POSITION_ON_ISSUE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="relationshipOwner">Relationship owner</Label>
                <Input id="relationshipOwner" name="relationshipOwner" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nextFollowUpDate">Next follow-up</Label>
                <Input id="nextFollowUpDate" name="nextFollowUpDate" type="date" />
              </div>
              <Button className="w-full" type="submit">
                Save relationship
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapped Stakeholders ({relationships.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {relationships.length === 0 ? (
              <p className="text-sm text-slate-600">No stakeholders mapped to this client yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Strategic value</TableHead>
                    <TableHead>Next follow-up</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationships.map((relationship) => {
                    const stakeholderInfo = readStakeholderInfo(relationship.stakeholders);
                    return (
                      <TableRow key={relationship.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{stakeholderInfo.full_name || "Unknown stakeholder"}</p>
                            <p className="text-xs text-slate-500">{stakeholderInfo.title || stakeholderInfo.organization || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{stakeholderInfo.stakeholder_type || "—"}</TableCell>
                        <TableCell>
                          <StatusPill
                            className={RELATIONSHIP_STRENGTH_STYLES[relationship.relationship_strength] ?? "bg-slate-100 text-slate-700 border-slate-200"}
                            label={relationship.relationship_strength}
                          />
                        </TableCell>
                        <TableCell>{relationship.strategic_value}</TableCell>
                        <TableCell>{relationship.next_follow_up_date || "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/stakeholders/${relationship.stakeholder_id}`}>Open</Link>
                            </Button>
                            <form action={deleteRelationshipAction}>
                              <input name="relationshipId" type="hidden" value={relationship.id} />
                              <input name="stakeholderId" type="hidden" value={relationship.stakeholder_id} />
                              <input name="clientId" type="hidden" value={relationship.client_id} />
                              <Button size="sm" type="submit" variant="ghost">
                                Remove
                              </Button>
                            </form>
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
      </section>
    </div>
  );
}
