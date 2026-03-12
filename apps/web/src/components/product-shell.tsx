"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarRange, CigaretteOff, LogOut, Medal, Settings, User2, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session-provider";
import { cn } from "@/lib/utils";

const navigation: Array<{ href: Route; label: string; icon: typeof CigaretteOff }> = [
  { href: "/today", label: "Hoy", icon: Zap },
  { href: "/dashboard", label: "Dashboard", icon: CigaretteOff },
  { href: "/calendar", label: "Calendario", icon: CalendarRange },
  { href: "/achievements", label: "Medallas", icon: Medal },
  { href: "/stats", label: "Estadisticas", icon: BarChart3 },
  { href: "/settings", label: "Configuracion", icon: Settings }
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const isOnboarding = pathname === "/onboarding";

  async function handleLogout() {
    await session.logout();
    router.replace("/login");
  }

  return (
    <AppShell>
      <header className="sticky top-3 z-20 flex flex-col gap-4 rounded-[28px] border border-border/80 bg-card/75 p-4 shadow-2xl shadow-black/25 backdrop-blur md:top-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={session.onboardingCompleted ? "/today" : "/onboarding"} className="text-lg font-semibold tracking-tight text-foreground">
              Pucho
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {session.user ? `Sesión de ${session.user.displayName}` : "Seguimiento personal para dejar de fumar con base real."}
            </p>
          </div>
          <Button className="md:hidden" onClick={handleLogout} size="sm" variant="ghost">
            <LogOut className="size-4" />
          </Button>
        </div>
        {!isOnboarding ? (
        <nav className="hidden flex-wrap gap-2 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive
                    ? "border-success/30 bg-success/10 text-foreground shadow-lg shadow-success/10"
                    : "border-border bg-background/60 text-muted-foreground hover:border-success/30 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        ) : (
          <div className="hidden md:block rounded-full border border-success/20 bg-success/10 px-4 py-2 text-sm text-success">
            Onboarding guiado
          </div>
        )}
        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-2 text-sm text-muted-foreground">
            <User2 className="size-4" />
            {session.user?.displayName ?? "Cuenta"}
          </div>
          <Button onClick={handleLogout} size="sm" variant="ghost">
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </header>
      <div className={cn("pb-24 md:pb-0", isOnboarding ? "pb-8 md:pb-0" : "")}>{children}</div>
      {!isOnboarding ? (
        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 gap-2 rounded-[28px] border border-border/80 bg-card/90 p-2 shadow-2xl shadow-black/40 backdrop-blur md:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] text-muted-foreground",
                  isActive ? "bg-success/12 text-foreground" : "hover:bg-background/60"
                )}
              >
                <Icon className="size-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </AppShell>
  );
}
