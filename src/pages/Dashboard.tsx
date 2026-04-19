import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStats, getRecentlyUpdated, listCategories, checkAllUpdates } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, RefreshCw, Server, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AppCard } from "@/components/AppCard";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const { data: recentApps, isLoading: recentLoading } = useQuery({
    queryKey: ["recently-updated"],
    queryFn: () => getRecentlyUpdated(5),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const checkAll = useMutation({
    mutationFn: checkAllUpdates,
    onSuccess: (results) => {
      const updatesFound = results.filter((r) => r.hasUpdate).length;
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["recently-updated"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      toast({
        title: "Update Check Complete",
        description: `Checked ${results.length} apps. Found ${updatesFound} updates.`,
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Update Check Failed",
        description: err.message || "An error occurred while checking for updates.",
      });
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your tracked applications.</p>
        </div>
        <Button onClick={() => checkAll.mutate()} disabled={checkAll.isPending} className="gap-2 shadow-none">
          <RefreshCw className={`w-4 h-4 ${checkAll.isPending ? "animate-spin" : ""}`} />
          Check All Updates
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tracked" value={stats?.total} loading={statsLoading} icon={<Server className="w-4 h-4 text-primary" />} />
        <StatCard title="Installed" value={stats?.installed} loading={statsLoading} icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} />
        <StatCard title="Updates Available" value={stats?.updateAvailable} loading={statsLoading} icon={<AlertCircle className="w-4 h-4 text-amber-500" />} highlight={!!stats?.updateAvailable && stats.updateAvailable > 0} />
        <StatCard title="Not Installed" value={stats?.notInstalled} loading={statsLoading} icon={<Circle className="w-4 h-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recently Checked</h2>
            <Link href="/apps">
              <Button variant="ghost" size="sm" className="gap-2">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {recentLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-md" />)
            ) : recentApps && recentApps.length > 0 ? (
              recentApps.map((app, index) => (
                <div key={app.id} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}>
                  <AppCard app={app} />
                </div>
              ))
            ) : (
              <Card className="border-dashed bg-card/50">
                <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                  <p className="text-muted-foreground">No apps checked yet. Click "Check All Updates" to start.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Categories</h2>
          <Card className="border-border">
            <CardContent className="p-0 divide-y divide-border">
              {categoriesLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-4 w-2/3" /></div>)
              ) : categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <Link key={cat.category} href={`/apps?category=${encodeURIComponent(cat.category)}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <span className="font-medium group-hover:text-primary transition-colors">{cat.category}</span>
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-mono font-medium">{cat.count}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">No categories yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon, highlight }: { title: string; value?: number; loading: boolean; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={`border-border transition-colors ${highlight ? "border-amber-500/50 bg-amber-500/5" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16 mt-1" />
        ) : (
          <div className={`text-3xl font-bold font-mono tracking-tighter ${highlight ? "text-amber-500" : ""}`}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
