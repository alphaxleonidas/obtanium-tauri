import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listApps, listCategories } from "@/lib/api";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Plus, X } from "lucide-react";
import { AppCard } from "@/components/AppCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

export default function AppLibrary() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [searchQuery, setSearchQuery] = useState("");
  const categoryParam = searchParams.get("category") || "all";
  const statusParam = searchParams.get("status") || "all";

  const { data: apps, isLoading } = useQuery({
    queryKey: ["apps", categoryParam, statusParam],
    queryFn: () => listApps({
      category: categoryParam === "all" ? undefined : categoryParam,
      status: statusParam === "all" ? undefined : statusParam,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const filteredApps = useMemo(() => {
    if (!apps) return [];
    if (!searchQuery) return apps;
    const lowerQuery = searchQuery.toLowerCase();
    return apps.filter((app) =>
      app.name.toLowerCase().includes(lowerQuery) ||
      (app.description && app.description.toLowerCase().includes(lowerQuery))
    );
  }, [apps, searchQuery]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const newSearch = params.toString();
    setLocation(`/apps${newSearch ? `?${newSearch}` : ""}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Library</h1>
          <p className="text-muted-foreground">Manage all your tracked applications.</p>
        </div>
        <Link href="/apps/new">
          <Button className="gap-2 shadow-none">
            <Plus className="w-4 h-4" />
            Add App
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-9 font-mono text-sm bg-card border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={statusParam} onValueChange={(v) => updateFilters("status", v)}>
            <SelectTrigger className="w-[180px] bg-card border-border font-mono text-sm">
              <Filter className="w-4 h-4 mr-2 opacity-50" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="installed">Installed</SelectItem>
              <SelectItem value="update_available">Update Available</SelectItem>
              <SelectItem value="not_installed">Not Installed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryParam} onValueChange={(v) => updateFilters("category", v)}>
            <SelectTrigger className="w-[180px] bg-card border-border font-mono text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[140px] w-full rounded-md" />)
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app, index) => (
            <div key={app.id} className="animate-in fade-in zoom-in-95" style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}>
              <AppCard app={app} />
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border border-dashed border-border rounded-lg bg-card/50">
            <h3 className="text-lg font-medium mb-1">No applications found</h3>
            <p className="text-muted-foreground text-sm">
              {apps?.length === 0 ? "Add your first app using the button above." : "Try adjusting your search or filters."}
            </p>
            {(searchQuery || categoryParam !== "all" || statusParam !== "all") && (
              <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(""); setLocation("/apps"); }}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
