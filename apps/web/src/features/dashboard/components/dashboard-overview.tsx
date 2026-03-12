"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarRange, Flame, TimerReset, Wallet } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type DailyEntry, type Profile, type ProfileSettingsSnapshot, type StatsSummary } from "@/lib/api";

const fallbackProfile: Profile = {
  id: "local-profile",
  timezone: "America/Argentina/Buenos_Aires",
  planMode: "REDUCE",
  baselineDailyConsumption: 8,
  dailyGoal: 3,
  packPrice: 4500,
  monthlyFreeDays: 4,
  onboardingCompleted: false,
  onboardingCompletedAt: null,
  settingsEffectiveFrom: new Date().toISOString().slice(0, 10),
  persistenceStatus: "fallback"
};

const fallbackStats: StatsSummary = {
  smokeFreeDays: 1,
  moneySaved: 2475,
  cigarettesAvoided: 11,
  smokeFreeHours: 0,
  currentStreak: 1,
  bestStreak: 1,
  monthlyFreeDaysRemaining: 3
};

const fallbackEntries: DailyEntry[] = [
  {
    id: "entry-1",
    date: "2026-03-09",
    cigarettesSmoked: 0,
    dailyGoal: 3,
    status: "SUCCESS",
    freeDayUsed: false,
    moneySaved: 1800,
    cigarettesAvoided: 8,
    smokeFreeHours: 24
  },
  {
    id: "entry-2",
    date: "2026-03-10",
    cigarettesSmoked: 5,
    dailyGoal: 3,
    status: "USED_FREE_DAY",
    freeDayUsed: true,
    moneySaved: 675,
    cigarettesAvoided: 3,
    smokeFreeHours: 0
  }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function differenceInDays(fromDate: string) {
  const from = new Date(fromDate);
  const today = new Date();
  const diffMs = today.getTime() - from.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function DashboardOverview() {
  const [profile, setProfile] = useState(fallbackProfile);
  const [stats, setStats] = useState(fallbackStats);
  const [entries, setEntries] = useState<DailyEntry[]>(fallbackEntries);
  const [settingsHistory, setSettingsHistory] = useState<ProfileSettingsSnapshot[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextProfile, nextStats, nextEntries, nextSettingsHistory] = await Promise.all([
          api.getProfile(),
          api.getStats(),
          api.getDailyEntries(),
          api.getProfileSettingsHistory()
        ]);

        if (!active) return;
        setProfile(nextProfile);
        setStats(nextStats);
        setEntries(nextEntries);
        setSettingsHistory(nextSettingsHistory);
      } catch {
        if (!active) return;
        setFeedback("No se pudo cargar el resumen en tiempo real. Se muestran datos fallback.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const recentInsights = useMemo(() => {
    const latestEntry = entries.at(-1) ?? null;
    const latestSmokeFree = [...entries].reverse().find((entry) => entry.cigarettesSmoked === 0) ?? null;
    const weekEntries = entries.slice(-7);
    const weekSavings = weekEntries.reduce((sum, entry) => sum + entry.moneySaved, 0);
    const averageSmoked =
      entries.length === 0 ? 0 : Math.round((entries.reduce((sum, entry) => sum + entry.cigarettesSmoked, 0) / entries.length) * 10) / 10;
    const trend =
      averageSmoked <= profile.dailyGoal
        ? "Consumo dentro del objetivo"
        : averageSmoked <= profile.baselineDailyConsumption
          ? "Consumo bajando"
          : "Consumo por encima de la linea base";

    return {
      latestEntry,
      latestSmokeFree,
      weekSavings,
      averageSmoked,
      trend
    };
  }, [entries, profile.baselineDailyConsumption, profile.dailyGoal]);

  const latestSettingsChange = settingsHistory[0] ?? null;
  const previousSettingsChange = settingsHistory[1] ?? null;

  const metrics = [
    {
      label: "Racha actual",
      value: `${stats.currentStreak} dias`,
      hint: "Incluye dias libres usados sin cortar continuidad.",
      tone: "success" as const
    },
    {
      label: "Mejor racha",
      value: `${stats.bestStreak} dias`,
      hint: "Tu mejor bloque historico hasta ahora.",
      tone: "default" as const
    },
    {
      label: "Dinero ahorrado",
      value: formatCurrency(stats.moneySaved),
      hint: "Calculado contra consumo base diario.",
      tone: "warning" as const
    },
    {
      label: "Cigarrillos evitados",
      value: `${stats.cigarettesAvoided}`,
      hint: "Acumulado real desde tu linea base.",
      tone: "default" as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Centro de resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Link
              href="/today"
              className="rounded-2xl border border-success/20 bg-success/10 p-4 transition hover:border-success/35"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-success">Accion principal</p>
              <p className="mt-3 text-lg font-semibold text-foreground">Cargar hoy</p>
              <p className="mt-1 text-sm text-muted-foreground">Entrá directo a la pantalla pensada para registrar rápido.</p>
              <ArrowUpRight className="mt-4 size-4 text-foreground" />
            </Link>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lectura del mes</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{stats.monthlyFreeDaysRemaining} dias libres disponibles</p>
              <p className="mt-1 text-sm text-muted-foreground">Quedan {stats.monthlyFreeDaysRemaining} oportunidades de absorber un desborde sin romper la continuidad.</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Economia reciente</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(recentInsights.weekSavings)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Ahorro acumulado en las ultimas {Math.min(7, entries.length)} cargas.</p>
            </div>

            <Link
              href="/calendar"
              className="rounded-2xl border border-border bg-background/60 p-4 transition hover:border-success/25"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarRange className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Proximo control</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">Revisar calendario</p>
              <p className="mt-1 text-sm text-muted-foreground">Ideal para detectar patrones semanales, dias libres usados y cortes de racha.</p>
            </Link>

            <Link
              href="/settings"
              className="rounded-2xl border border-success/20 bg-success/10 p-4 transition hover:border-success/35"
            >
              <div className="flex items-center gap-2 text-success">
                <TimerReset className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Ultimo cambio de reglas</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {latestSettingsChange ? `Desde ${latestSettingsChange.effectiveFrom}` : "Sin historial todavía"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestSettingsChange
                  ? `Objetivo ${latestSettingsChange.dailyGoal}, base ${latestSettingsChange.baselineDailyConsumption} y caja en ${formatCurrency(latestSettingsChange.packPrice)}.`
                  : "Configurá reglas para activar este insight."}
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Resumen reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ultimo dia limpio</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {recentInsights.latestSmokeFree ? `Hace ${differenceInDays(recentInsights.latestSmokeFree.date)} dias` : "Todavia no hubo dias limpios"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Tendencia</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{recentInsights.trend}</p>
              <p className="mt-1 text-sm text-muted-foreground">Promedio reciente: {recentInsights.averageSmoked} cigarrillos por carga.</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ultima carga</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{recentInsights.latestEntry?.date ?? "Sin historial"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {recentInsights.latestEntry
                  ? `${recentInsights.latestEntry.cigarettesSmoked} fumados · ${recentInsights.latestEntry.status}`
                  : "Cargá tu primer dia para activar el resumen."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Modo activo</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {profile.planMode === "QUIT" ? "Dejar por completo" : "Reduccion progresiva manual"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Objetivo diario actual: {profile.dailyGoal} cigarrillos.</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TimerReset className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Insight de configuracion</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {latestSettingsChange ? `La regla actual corre desde ${latestSettingsChange.effectiveFrom}` : "Todavía no hay cambios versionados"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestSettingsChange
                  ? previousSettingsChange
                    ? `Antes corría una versión previa desde ${previousSettingsChange.effectiveFrom}. Los cálculos viejos no se reinterpretan.`
                    : "Todavía no hay una versión previa para comparar, pero el historial ya quedó activado."
                  : "Cuando cambies precio, base u objetivo, el dashboard lo va a señalar acá."}
              </p>
            </div>

            {feedback ? <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">{feedback}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
