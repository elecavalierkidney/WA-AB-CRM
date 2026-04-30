import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getClientById, listClientWatchlist } from "@/lib/server/queries";

import { createWatchlistItemAction, deleteWatchlistItemAction, updateWatchlistItemAction } from "../../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientWatchlistPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  const watchlist = await listClientWatchlist(id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${client.name} Watchlist`}
        description="Maintain the terms used for client-specific monitoring and matching."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/clients/${id}`}>Back to client</Link>
          </Button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Watchlist Term</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createWatchlistItemAction} className="space-y-3">
              <input name="clientId" type="hidden" value={id} />
              <div className="space-y-1">
                <Label htmlFor="keyword">Keyword</Label>
                <Input id="keyword" name="keyword" placeholder="food security" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="policy area" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight">Weight (1-10)</Label>
                <Input defaultValue="5" id="weight" max={10} min={1} name="weight" type="number" />
              </div>
              <Button className="w-full" type="submit">
                Add term
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Terms ({watchlist.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {watchlist.length === 0 ? (
              <p className="text-sm text-slate-600">No terms yet for this client.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {watchlist.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.keyword}</TableCell>
                      <TableCell>{item.category || "—"}</TableCell>
                      <TableCell>{item.weight}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <details>
                            <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-900">
                              Edit
                            </summary>
                            <form action={updateWatchlistItemAction} className="mt-2 w-72 space-y-2 rounded border p-3">
                              <input name="id" type="hidden" value={item.id} />
                              <input name="clientId" type="hidden" value={id} />
                              <Input defaultValue={item.keyword} name="keyword" required />
                              <Input defaultValue={item.category || ""} name="category" />
                              <Input defaultValue={item.weight} max={10} min={1} name="weight" type="number" />
                              <Button size="sm" type="submit">
                                Save
                              </Button>
                            </form>
                          </details>
                          <form action={deleteWatchlistItemAction}>
                            <input name="id" type="hidden" value={item.id} />
                            <input name="clientId" type="hidden" value={id} />
                            <Button size="sm" type="submit" variant="ghost">
                              Delete
                            </Button>
                          </form>
                        </div>
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
