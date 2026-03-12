"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarRange, Flame, Sparkles, Target, Wallet } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type DailyEntry, type Profile, type StatsSummary } from "@/lib/api";

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
  smokeFreeHours: 24,
  currentStreak: 1,
  bestStreak: 1,
  monthlyFreeDaysRemaining: 3,
  entriesCount: 2
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

function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getPreviousPeriod(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function changeLabel(current: number, previous: number, formatter?: (value: number) => string) {
  const diff = current - previous;
  const formatValue = formatter ?? ((value: number) => String(Math.abs(value)));

  if (diff === 0) {
    return "Sin cambio frente al mes anterior";
  }

  const direction = diff > 0 ? "arriba" : "abajo";
  return `${formatValue(diff)} ${direction} vs mes anterior`;
}

export function StatsLiveOverview() {
  const initialDate = new Date();
  const [selectedYear, setSelectedYear] = useState(initialDate.getUTCFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getUTCMonth() + 1);
  const [profile, setProfile] = useState(fallbackProfile);
  const [stats, setStats] = useState(fallbackStats);
  const [previousStats, setPreviousStats] = useState(fallbackStats);
  const [entries, setEntries] = useState<DailyEntry[]>(fallbackEntries);
  const [previousEntries, setPreviousEntries] = useState<DailyEntry[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const previousPeriod = getPreviousPeriod(selectedYear, selectedMonth);

    async function load() {
      try {
        const [nextProfile, nextStats, nextPreviousStats, nextEntries, nextPreviousEntries] = await Promise.all([
          api.getProfile(),
          api.getStats({ year: selectedYear, month: selectedMonth }),
          api.getStats(previousPeriod),
          api.getDailyEntries({ year: selectedYear, month: selectedMonth }),
          api.getDailyEntries(previousPeriod)
        ]);

        if (!active) {
          return;
        }

        setProfile(nextProfile);
        setStats(nextStats);
        setPreviousStats(nextPreviousStats);
        setEntries(nextEntries);
        setPreviousEntries(nextPreviousEntries);
        setFeedback(null);
      } catch {
        if (!active) {
          return;
        }

        setFeedback("No se pudo cargar la lectura comparativa en tiempo real. Se muestran datos fallback.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  const periodLabel = formatMonth(selectedYear, selectedMonth);
  const previousPeriod = getPreviousPeriod(selectedYear, selectedMonth);
  const previousPeriodLabel = formatMonth(previousPeriod.year, previousPeriod.month);

  const insights = useMemo(() => {
    const successful = entries.filter((entry) => entry.status === "SUCCESS").length;
    const coveredByFreeDay = entries.filter((entry) => entry.status === "USED_FREE_DAY").length;
    const failed = entries.filter((entry) => entry.status === "FAILED").length;
    const compliant = successful + coveredByFreeDay;
    const complianceRate = entries.length === 0 ? 0 : Math.round((compliant / entries.length) * 100);
    const smokeFreeRate = entries.length === 0 ? 0 : Math.round((stats.smokeFreeDays / entries.length) * 100);
    const averageSmoked =
      entries.length === 0 ? 0 : Math.round((entries.reduce((sum, entry) => sum + entry.cigarettesSmoked, 0) / entries.length) * 10) / 10;
    const previousAverageSmoked =
      previousEntries.length === 0
        ? 0
        : Math.round((previousEntries.reduce((sum, entry) => sum + entry.cigarettesSmoked, 0) / previousEntries.length) * 10) / 10;
    const averageDelta = Math.round((averageSmoked - previousAverageSmoked) * 10) / 10;
    const savingsPerEntry = entries.length === 0 ? 0 : Math.round(stats.moneySaved / entries.length);
    const strongestDay = [...entries].sort((left, right) => right.moneySaved - left.moneySaved)[0] ?? null;
    const worstDay = [...entries].sort((left, right) => right.cigarettesSmoked - left.cigarettesSmoked)[0] ?? null;

    const rhythmLabel =
      averageSmoked === 0
        ? "Mes completamente limpio"
        : averageSmoked <= profile.dailyGoal
          ? "Consumo dentro del objetivo"
          : averageSmoked <= profile.baselineDailyConsumption
            ? "Reduccion sostenida, pero con margen"
            : "Consumo todavia por encima de la linea base";

    return {
      successful,
      coveredByFreeDay,
      failed,
      complianceRate,
      smokeFreeRate,
      averageSmoked,
      averageDelta,
      savingsPerEntry,
      strongestDay,
      worstDay,
      rhythmLabel
    };
  }, [entries, previousEntries, profile.baselineDailyConsumption, profile.dailyGoal, stats.moneySaved, stats.smokeFreeDays]);

  const metrics: Array<{
    label: string;
    value: string;
    hint: string;
    tone: "default" | "success" | "warning";
  }> = [
    {
      label: "Ahorro del mes",
      value: formatCurrency(stats.moneySaved),
      hint: changeLabel(stats.moneySaved, previousStats.moneySaved, (value) => formatCurrency(Math.abs(value))),
      tone: "warning" as const
    },
    {
      label: "Cigarrillos evitados",
      value: String(stats.cigarettesAvoided),
      hint: changeLabel(stats.cigarettesAvoided, previousStats.cigarettesAvoided),
      tone: "success" as const
    },
    {
      label: "Dias sin fumar",
      value: String(stats.smokeFreeDays),
      hint: `${insights.smokeFreeRate}% de los dias cargados quedaron en cero`,
      tone: "default" as const
    },
    {
      label: "Cumplimiento",
      value: `${insights.complianceRate}%`,
      hint: `${insights.successful} exitosos + ${insights.coveredByFreeDay} cubiertos por dias libres`,
      tone: insights.complianceRate >= 70 ? "success" : "default"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-success/15 bg-[radial-gradient(circle_at_top_left,rgba(221,107,32,0.18),transparent_24%),linear-gradient(135deg,rgba(221,107,32,0.08),rgba(17,18,23,0.92)_42%,rgba(17,18,23,0.98))]">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-success">
              <Sparkles className="size-3.5" />
              Lectura comparativa
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight capitalize text-foreground">{periodLabel}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Esta vista cruza ahorro, reduccion y consistencia del mes visible contra {previousPeriodLabel} para que
                entiendas si realmente estas consolidando cambio o solo teniendo dias sueltos.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-success/20 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promedio real</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{insights.averageSmoked}</p>
                <p className="mt-1 text-sm text-muted-foreground">cigarrillos por carga</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vs mes anterior</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">
                  {insights.averageDelta > 0 ? "+" : ""}
                  {insights.averageDelta}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">variacion del promedio por carga</p>
              </div>
              <div className="rounded-2xl border border-warning/25 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ahorro por registro</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{formatCurrency(insights.savingsPerEntry)}</p>
                <p className="mt-1 text-sm text-muted-foreground">impacto medio de cada carga</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Ritmo del mes</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground">{insights.rhythmLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Objetivo diario: {profile.dailyGoal}. Linea base: {profile.baselineDailyConsumption}.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarRange className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Carga del periodo</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">{stats.entriesCount ?? entries.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">registros cargados en el mes visible</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground"
          onClick={() => {
            if (selectedMonth === 1) {
              setSelectedMonth(12);
              setSelectedYear((year) => year - 1);
              return;
            }
            setSelectedMonth((month) => month - 1);
          }}
          type="button"
        >
          <ArrowLeft className="size-4" />
          Mes anterior
        </button>
        <div className="rounded-full border border-border bg-card/70 px-4 py-2 text-sm capitalize text-foreground">{periodLabel}</div>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground"
          onClick={() => {
            if (selectedMonth === 12) {
              setSelectedMonth(1);
              setSelectedYear((year) => year + 1);
              return;
            }
            setSelectedMonth((month) => month + 1);
          }}
          type="button"
        >
          Mes siguiente
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Consistencia operativa</CardTitle>
            <CardDescription>Que tan estable fue este mes, mas alla de una buena o mala jornada aislada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-success/20 bg-success/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-success">Exitosos</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{insights.successful}</p>
              <p className="mt-1 text-sm text-muted-foreground">Dias que quedaron dentro del objetivo sin consumir dias libres.</p>
            </div>
            <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-warning">Cubiertos por dia libre</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{insights.coveredByFreeDay}</p>
              <p className="mt-1 text-sm text-muted-foreground">Desbordes absorbidos sin cortar la continuidad.</p>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-red-300">Incumplidos</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{insights.failed}</p>
              <p className="mt-1 text-sm text-muted-foreground">Dias que rompieron el objetivo sin cobertura disponible.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dias libres restantes</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{stats.monthlyFreeDaysRemaining}</p>
              <p className="mt-1 text-sm text-muted-foreground">Margen operativo que todavia conserva este mes.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Lectura puntual</CardTitle>
            <CardDescription>Los extremos del periodo ayudan a entender donde estuvo el mayor avance y donde aparece friccion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Mejor jornada economica</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {insights.strongestDay ? formatCurrency(insights.strongestDay.moneySaved) : "Sin datos"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {insights.strongestDay
                  ? `${insights.strongestDay.date} · ${insights.strongestDay.cigarettesAvoided} evitados`
                  : "Todavia no hay registros suficientes."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Jornada mas cargada</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {insights.worstDay ? `${insights.worstDay.cigarettesSmoked} cigarrillos` : "Sin datos"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {insights.worstDay ? `${insights.worstDay.date} · ${insights.worstDay.status}` : "Todavia no hay registros suficientes."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Comparativa de ahorro</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{changeLabel(stats.moneySaved, previousStats.moneySaved, (value) => formatCurrency(Math.abs(value)))}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(stats.moneySaved)} en {periodLabel} frente a {formatCurrency(previousStats.moneySaved)} en {previousPeriodLabel}.
              </p>
            </div>

            {feedback ? <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">{feedback}</div> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Lectura ejecutiva</CardTitle>
          <CardDescription>Una frase util para resumir donde estas parado en este corte mensual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-success/20 bg-success/10 p-5">
            <p className="text-sm leading-7 text-foreground">
              {insights.complianceRate >= 70
                ? `Este mes viene consistente: ${insights.complianceRate}% de tus registros quedaron dentro del plan o absorbidos por dias libres.`
                : `Este mes todavia esta inestable: ${insights.complianceRate}% de cumplimiento indica que conviene revisar patrones en el calendario y ajustar el objetivo diario.`}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Racha actual</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{stats.currentStreak}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mejor racha</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{stats.bestStreak}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Horas sin nicotina</p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{stats.smokeFreeHours} h</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Modo activo</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {profile.planMode === "QUIT" ? "Dejar por completo" : "Reduccion manual"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
