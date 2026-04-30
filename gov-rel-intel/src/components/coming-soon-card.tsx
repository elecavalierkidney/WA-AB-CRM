import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonCardProps {
  message: string;
}

export function ComingSoonCard({ message }: ComingSoonCardProps) {
  return (
    <Card>
      <CardContent className="py-10 text-sm text-slate-600">{message}</CardContent>
    </Card>
  );
}
