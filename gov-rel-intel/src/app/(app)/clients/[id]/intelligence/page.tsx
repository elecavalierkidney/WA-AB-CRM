import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientIntelligencePage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/intelligence?clientId=${id}`);
}
