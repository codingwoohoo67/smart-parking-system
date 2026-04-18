import { Link } from "@tanstack/react-router";
import { Car, LayoutDashboard, ScanLine, Table2, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/entry", label: "Entry / Exit", icon: ScanLine, exact: false },
  { to: "/records", label: "Records", icon: Table2, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta text-terracotta-foreground shadow-soft">
            <Car className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold leading-tight sm:text-lg">
              Smart VIT Parking
            </h1>
            <p className="text-xs text-muted-foreground">
              Kiosk · 65 slots · single device
            </p>
          </div>
        </div>

        <nav className="flex flex-1 items-center justify-center">
          <ul className="flex items-center gap-1 rounded-full border bg-card/60 p-1 shadow-soft">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  activeOptions={{ exact: l.exact }}
                  className="group flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-terracotta data-[status=active]:text-terracotta-foreground data-[status=active]:shadow-soft"
                >
                  <l.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
