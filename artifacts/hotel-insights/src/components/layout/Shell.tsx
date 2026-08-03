import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Building2, Lightbulb, BarChart2 } from "lucide-react";

const navItems = [
  { href: "/",         label: "Dashboard",   icon: BarChart2 },
  { href: "/reviews",  label: "Reviews Feed", icon: MessageSquare },
  { href: "/hotels",   label: "Properties",   icon: Building2 },
  { href: "/insights", label: "AI Insights",  icon: Lightbulb },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 w-64 hidden lg:flex flex-col bg-sidebar text-sidebar-foreground">

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border shrink-0">
          {/* Azzurro-style pill dot accent */}
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shrink-0">
            R
          </span>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            Review<span className="text-primary font-bold">IQ</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Command Centre
          </p>
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer user block */}
        <div className="border-t border-sidebar-border px-4 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              AM
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Alex Manager</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate">Area Director</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile topbar ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-sidebar text-sidebar-foreground px-5 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
              R
            </span>
            <span className="text-sm font-semibold">
              Review<span className="text-primary font-bold">IQ</span>
            </span>
          </div>
          {/* Minimal mobile nav — show icons only */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "p-2 rounded transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
