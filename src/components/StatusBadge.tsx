import type { AppStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Circle } from "lucide-react";

export function StatusBadge({ status }: { status: AppStatus }) {
  switch (status) {
    case "installed":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-xs font-normal">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Installed
        </Badge>
      );
    case "update_available":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-xs font-normal">
          <AlertCircle className="w-3 h-3 mr-1" />
          Update Available
        </Badge>
      );
    case "checking":
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-mono text-xs font-normal">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Checking
        </Badge>
      );
    case "not_installed":
    default:
      return (
        <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-mono text-xs font-normal">
          <Circle className="w-3 h-3 mr-1" />
          Not Installed
        </Badge>
      );
  }
}
