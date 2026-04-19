import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApp, checkAppUpdate, markInstalled, deleteApp } from "@/lib/api";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { getSourceIcon } from "@/components/AppCard";
import { ArrowLeft, ExternalLink, Download, RefreshCw, Trash2, CheckCircle2, History, GitCommit } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AppDetail() {
  const { id } = useParams();
  const appId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [installVersion, setInstallVersion] = useState("");
  const [markInstalledOpen, setMarkInstalledOpen] = useState(false);

  const { data: app, isLoading } = useQuery({
    queryKey: ["app", appId],
    queryFn: () => getApp(appId),
    enabled: !!appId,
  });

  const checkUpdate = useMutation({
    mutationFn: () => checkAppUpdate(appId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["app", appId] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      if (result.hasUpdate) {
        toast({ title: "Update Available", description: `Version ${result.latestVersion} is available.` });
      } else {
        toast({ title: "Up to date", description: "You have the latest version." });
      }
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Update Check Failed", description: err.message || "An error occurred." });
    },
  });

  const markInstalledMutation = useMutation({
    mutationFn: (version: string) => markInstalled(appId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app", appId] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setMarkInstalledOpen(false);
      setInstallVersion("");
      toast({ title: "Marked as Installed", description: "The app status has been updated." });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: () => deleteApp(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "App Removed", description: "The app has been removed from tracking." });
      setLocation("/apps");
    },
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!app) {
    return <div className="text-center py-20">App not found.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/apps" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-lg bg-muted/30 border border-border flex items-center justify-center shrink-0 shadow-sm">
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-4xl font-bold font-display opacity-50 text-foreground">
                    {app.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight font-display">{app.name}</h1>
                  <StatusBadge status={app.status} />
                </div>
                {app.description && <p className="text-muted-foreground text-lg max-w-2xl">{app.description}</p>}
                <div className="flex flex-wrap items-center gap-4 mt-4 font-mono text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    {getSourceIcon(app.sourceType)}
                    <span className="opacity-80">{app.sourceType}</span>
                  </div>
                  <div className="text-muted-foreground bg-muted/50 px-2 py-1 rounded">{app.category}</div>
                  <a href={app.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                  {app.website && (
                    <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <Button onClick={() => checkUpdate.mutate()} disabled={checkUpdate.isPending} className="w-full gap-2 shadow-none">
                <RefreshCw className={`w-4 h-4 ${checkUpdate.isPending ? "animate-spin" : ""}`} />
                Check Update
              </Button>
              {app.downloadUrl ? (
                <Button variant="secondary" className="w-full gap-2 shadow-none" asChild>
                  <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                    Download Latest
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" className="w-full gap-2 shadow-none" disabled>
                  <Download className="w-4 h-4" />
                  No Download
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-primary" />
                Version Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/20 border border-border">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Installed Version</div>
                  <div className="text-2xl font-mono font-bold">
                    {app.installedVersion ? `v${app.installedVersion}` : <span className="text-muted-foreground/50">None</span>}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-sm font-medium text-primary mb-1">Latest Release</div>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {app.latestVersion ? `v${app.latestVersion}` : <span className="opacity-50">Unknown</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Dialog open={markInstalledOpen} onOpenChange={setMarkInstalledOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Mark as Installed
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Mark Installed Version</DialogTitle>
                      <DialogDescription>
                        Enter the version number you currently have installed to track updates against it.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Input
                        placeholder={app.latestVersion || "e.g. 1.0.0"}
                        value={installVersion}
                        onChange={(e) => setInstallVersion(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => markInstalledMutation.mutate(installVersion || app.latestVersion || "unknown")}
                        disabled={markInstalledMutation.isPending}
                      >
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {app.releaseNotes && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Latest Release Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-mono text-xs">{app.releaseNotes}</pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-muted-foreground" />
                Tracking Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm font-mono">
              <div>
                <div className="text-muted-foreground mb-1">Last Checked</div>
                <div>{app.lastChecked ? formatDistanceToNow(new Date(app.lastChecked), { addSuffix: true }) : "Never"}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Added On</div>
                <div>{format(new Date(app.createdAt), "MMM d, yyyy")}</div>
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <Button
                  variant="destructive"
                  className="w-full gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border border-destructive/20"
                  onClick={() => { if (confirm("Are you sure you want to stop tracking this app?")) deleteAppMutation.mutate(); }}
                  disabled={deleteAppMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                  Stop Tracking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
