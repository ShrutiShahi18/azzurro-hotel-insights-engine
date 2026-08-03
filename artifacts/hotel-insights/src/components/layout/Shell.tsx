import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Building2, Lightbulb, Activity } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reviews", label: "Reviews Feed", icon: MessageSquare },
    { href: "/hotels", label: "Properties", icon: Building2 },
    { href: "/insights", label: "AI Insights", icon: Lightbulb },
  ];

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r bg-background hidden lg:block">
        <div className="flex h-14 items-center border-b px-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
            <Activity className="h-5 w-5" />
            <span>ReviewIQ</span>
          </div>
        </div>
        <div className="px-4 py-6">
          <div className="space-y-1">
            <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Command Center
            </div>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              AM
            </div>
            <div>
              <div className="text-sm font-medium">Alex Manager</div>
              <div className="text-xs text-muted-foreground">Area Director</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile nav fallback - just a simple topbar for now */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6 lg:hidden">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <Activity className="h-5 w-5" />
            <span>ReviewIQ</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
