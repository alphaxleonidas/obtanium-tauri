import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Terminal,
  LayoutDashboard,
  Package,
  Settings as SettingsIcon,
  Activity,
  Plus
} from "lucide-react";
import { Button } from "./ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/apps", label: "Library", icon: Package },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground dark overflow-hidden selection:bg-primary/30">
      <aside className="w-64 border-r border-border bg-card flex flex-col z-10 shrink-0 relative">
        <div className="h-14 flex items-center px-4 border-b border-border">
          <Terminal className="w-5 h-5 text-primary mr-2" />
          <span className="font-display font-bold text-lg tracking-tight">Obtanium</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="mb-4">
            <p className="px-2 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Menu</p>
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${active ? "text-primary" : "opacity-70"}`} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8">
            <Link href="/apps/new">
              <Button className="w-full justify-start gap-2 shadow-none" variant="secondary">
                <Plus className="w-4 h-4" />
                Add App
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border bg-card text-xs font-mono text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Local App</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-green-500"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Running</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="flex-1 overflow-y-auto z-10 p-6 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
