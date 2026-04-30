import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
];
const optionalEnv = ["OPENAI_MODEL", "CRON_SECRET", "APP_BASE_URL"];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Environment and platform setup guidance for this workspace."
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {requiredEnv.map((variable) => (
            <p className="rounded bg-slate-100 px-2 py-1 font-mono text-xs" key={variable}>
              {variable}
            </p>
          ))}
          <p className="pt-2 text-slate-600">
            Add these to your local environment before running full Supabase + AI workflows.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Optional Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {optionalEnv.map((variable) => (
            <p className="rounded bg-slate-100 px-2 py-1 font-mono text-xs" key={variable}>
              {variable}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
