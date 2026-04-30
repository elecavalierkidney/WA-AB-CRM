import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  className?: string;
}

export function StatusPill({ label, className }: StatusPillProps) {
  return (
    <Badge className={cn("border text-xs font-medium", className)} variant="outline">
      {label}
    </Badge>
  );
}
