import Link from "next/link";
import { notFound } from "next/navigation";

import {
  cancelGovernmentContactsImportAction,
  confirmGovernmentContactsImportAction,
} from "@/app/(app)/stakeholders/actions";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

interface PreviewContact {
  fullName: string;
  title?: string;
  organization?: string;
  ministry?: string;
  riding?: string;
  stakeholderType?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

function readPreview(value: unknown) {
  const output = value as {
    contacts?: PreviewContact[];
    totalRows?: number;
    validRows?: number;
    invalidRows?: number;
  } | null;

  return {
    contacts: output?.contacts ?? [],
    totalRows: output?.totalRows ?? 0,
    validRows: output?.validRows ?? 0,
    invalidRows: output?.invalidRows ?? 0,
  };
}

export default async function GovernmentContactImportReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (!params.id) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("ai_outputs")
    .select("output_json")
    .eq("related_entity_type", "government_contact_import")
    .eq("related_entity_id", params.id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const preview = readPreview(data.output_json);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review government import"
        description="Check parsed directory rows before they are saved into Government contacts."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/stakeholders">Back</Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border border-slate-200 bg-white">
          <CardContent className="py-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Rows read</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{preview.totalRows}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="py-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Ready to import</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{preview.validRows}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 bg-white">
          <CardContent className="py-4">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Invalid rows</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{preview.invalidRows}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-semibold text-slate-950">Parsed contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preview.contacts.map((contact, index) => (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={`${contact.fullName}-${index}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{contact.fullName}</p>
                  <p className="text-sm text-slate-600">{contact.title || "No title"}</p>
                </div>
                <StatusPill
                  className="border-blue-200 bg-blue-50 text-blue-700"
                  label={contact.stakeholderType || "Department Official"}
                />
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                <p><span className="font-semibold text-slate-800">Org:</span> {contact.organization || "-"}</p>
                <p><span className="font-semibold text-slate-800">Ministry:</span> {contact.ministry || "-"}</p>
                <p><span className="font-semibold text-slate-800">Riding:</span> {contact.riding || "-"}</p>
                <p><span className="font-semibold text-slate-800">Email:</span> {contact.email || "-"}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <form action={confirmGovernmentContactsImportAction}>
              <input name="importId" type="hidden" value={params.id} />
              <Button type="submit">Confirm import</Button>
            </form>
            <form action={cancelGovernmentContactsImportAction}>
              <input name="importId" type="hidden" value={params.id} />
              <Button type="submit" variant="outline">Cancel</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
