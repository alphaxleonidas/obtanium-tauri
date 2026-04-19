import type { App } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { StatusBadge } from "./StatusBadge";
import { SiGithub, SiGitlab } from "react-icons/si";
import { Globe, Box } from "lucide-react";

export function getSourceIcon(type: string) {
  switch (type) {
    case "github": return <SiGithub className="w-4 h-4" />;
    case "gitlab": return <SiGitlab className="w-4 h-4" />;
    case "appimage_github": return <Box className="w-4 h-4" />;
    case "direct_url":
    default: return <Globe className="w-4 h-4" />;
  }
}

export function AppCard({ app }: { app: App }) {
  return (
    <Link href={`/apps/${app.id}`}>
      <Card className="hover-elevate cursor-pointer border-border transition-colors group bg-card hover:border-primary/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded bg-muted/30 border border-border flex items-center justify-center shrink-0">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-xl font-bold font-display opacity-50 text-foreground">
                    {app.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{app.name}</h3>
                  <StatusBadge status={app.status} />
                </div>
                {app.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{app.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-mono">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded">
                    {getSourceIcon(app.sourceType)}
                    <span className="opacity-80 truncate max-w-[120px]">{app.sourceType}</span>
                  </div>
                  <span className="bg-muted/50 px-2 py-0.5 rounded opacity-80">{app.category}</span>
                  {app.installedVersion && (
                    <span className="text-primary/80">v{app.installedVersion}</span>
                  )}
                  {app.lastChecked && (
                    <span className="opacity-60">{formatDistanceToNow(new Date(app.lastChecked), { addSuffix: true })}</span>
                  )}
                </div>
              </div>
            </div>

            {app.latestVersion && app.status === "update_available" && (
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-xs font-mono text-muted-foreground">Latest</span>
                <Badge variant="secondary" className="font-mono bg-primary/20 text-primary border-primary/20">
                  v{app.latestVersion}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
