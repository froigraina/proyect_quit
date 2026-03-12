"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, LockKeyhole, Sparkles, Target, Trophy } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Achievement, type StatsSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const fallbackAchievements: Achievement[] = [
  {
    key: "first-smoke-free-day",
    title: "Primer dia sin fumar",
    description: "Primer registro diario con consumo 0.",
    unlocked: false,
    threshold: 1,
    type: "SMOKE_FREE_DAYS"
  },
  {
    key: "three-smoke-free-days",
    title: "Tres dias limpios",
    description: "Acumular 3 dias con consumo 0.",
    unlocked: false,
    threshold: 3,
    type: "SMOKE_FREE_DAYS"
  },
  {
    key: "seven-smoke-free-days",
    title: "Semana limpia",
    description: "Llegar a 7 dias sin fumar.",
    unlocked: false,
    threshold: 7,
    type: "SMOKE_FREE_DAYS"
  },
  {
    key: "three-day-streak",
    title: "Racha de 3 dias",
    description: "Encadenar 3 dias exitosos.",
    unlocked: false,
    threshold: 3,
    type: "STREAK"
  },
  {
    key: "seven-day-streak",
    title: "Racha de 7 dias",
    description: "Sostener una semana completa.",
    unlocked: false,
    threshold: 7,
    type: "STREAK"
  },
  {
    key: "fourteen-day-streak",
    title: "Racha de 14 dias",
    description: "Sostener dos semanas completas.",
    unlocked: false,
    threshold: 14,
    type: "STREAK"
  },
  {
    key: "thirty-day-streak",
    title: "Racha de 30 dias",
    description: "Alcanzar un mes entero de continuidad.",
    unlocked: false,
    threshold: 30,
    type: "STREAK"
  },
  {
    key: "first-savings",
    title: "Primer ahorro serio",
    description: "Acumular $10.000 de ahorro.",
    unlocked: false,
    threshold: 10000,
    type: "MONEY_SAVED"
  },
  {
    key: "major-savings",
    title: "Ahorro mayor",
    description: "Acumular $50.000 de ahorro.",
    unlocked: false,
    threshold: 50000,
    type: "MONEY_SAVED"
  },
  {
    key: "hundred-avoided",
    title: "100 cigarrillos evitados",
    description: "Hito acumulado de reduccion.",
    unlocked: false,
    threshold: 100,
    type: "CIGARETTES_AVOIDED"
  },
  {
    key: "three-hundred-avoided",
    title: "300 cigarrillos evitados",
    description: "Reduccion acumulada cada vez mas visible.",
    unlocked: false,
    threshold: 300,
    type: "CIGARETTES_AVOIDED"
  }
];

const fallbackStats: StatsSummary = {
  smokeFreeDays: 0,
  moneySaved: 0,
  cigarettesAvoided: 0,
  smokeFreeHours: 0,
  currentStreak: 0,
  bestStreak: 0,
  monthlyFreeDaysRemaining: 4,
  entriesCount: 0
};

type EnrichedAchievement = Achievement & {
  currentValue: number;
  remaining: number;
  progress: number;
  progressLabel: string;
  categoryLabel: string;
};

function metricValueForAchievement(achievement: Achievement, stats: StatsSummary) {
  switch (achievement.type) {
    case "SMOKE_FREE_DAYS":
      return stats.smokeFreeDays;
    case "STREAK":
      return stats.bestStreak;
    case "MONEY_SAVED":
      return stats.moneySaved;
    case "CIGARETTES_AVOIDED":
      return stats.cigarettesAvoided;
    default:
      return 0;
  }
}

function categoryLabel(type?: string) {
  switch (type) {
    case "SMOKE_FREE_DAYS":
      return "Dias sin fumar";
    case "STREAK":
      return "Rachas";
    case "MONEY_SAVED":
      return "Ahorro";
    case "CIGARETTES_AVOIDED":
      return "Reduccion";
    default:
      return "Hito";
  }
}

function progressLabel(type: string | undefined, currentValue: number, threshold: number) {
  switch (type) {
    case "SMOKE_FREE_DAYS":
      return `${currentValue}/${threshold} dias sin fumar`;
    case "STREAK":
      return `${currentValue}/${threshold} dias de mejor racha`;
    case "MONEY_SAVED":
      return `$${currentValue.toFixed(0)} / $${threshold.toFixed(0)}`;
    case "CIGARETTES_AVOIDED":
      return `${currentValue}/${threshold} cigarrillos evitados`;
    default:
      return `${currentValue}/${threshold}`;
  }
}

function remainingLabel(achievement: EnrichedAchievement) {
  if (achievement.unlocked || achievement.remaining <= 0) {
    return "Desbloqueada permanentemente";
  }

  switch (achievement.type) {
    case "SMOKE_FREE_DAYS":
      return `Te faltan ${achievement.remaining} dias sin fumar.`;
    case "STREAK":
      return `Te faltan ${achievement.remaining} dias para ese pico de racha.`;
    case "MONEY_SAVED":
      return `Te faltan $${achievement.remaining.toFixed(0)} de ahorro acumulado.`;
    case "CIGARETTES_AVOIDED":
      return `Te faltan ${achievement.remaining} cigarrillos evitados.`;
    default:
      return `Te falta ${achievement.remaining}.`;
  }
}

export function AchievementGalleryLive() {
  const [achievements, setAchievements] = useState<Achievement[]>(fallbackAchievements);
  const [stats, setStats] = useState<StatsSummary>(fallbackStats);

  useEffect(() => {
    let active = true;

    void Promise.all([api.getAchievements(), api.getStats()])
      .then(([nextAchievements, nextStats]) => {
        if (!active) {
          return;
        }

        setAchievements(nextAchievements);
        setStats(nextStats);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const enrichedAchievements = useMemo<EnrichedAchievement[]>(() => {
    return achievements.map((achievement) => {
      const threshold = achievement.threshold ?? 1;
      const currentValue = metricValueForAchievement(achievement, stats);
      const remaining = Math.max(0, threshold - currentValue);
      const progress = achievement.unlocked ? 100 : Math.min(100, Math.round((currentValue / threshold) * 100));

      return {
        ...achievement,
        currentValue,
        remaining,
        progress,
        progressLabel: progressLabel(achievement.type, currentValue, threshold),
        categoryLabel: categoryLabel(achievement.type)
      };
    });
  }, [achievements, stats]);

  const unlocked = enrichedAchievements.filter((achievement) => achievement.unlocked);
  const locked = enrichedAchievements
    .filter((achievement) => !achievement.unlocked)
    .sort((left, right) => left.remaining - right.remaining);
  const nextAchievement = locked[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/15 via-card/95 to-card/70">
          <CardHeader className="pb-4">
            <div className="mb-4 flex items-center gap-2 text-success">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.24em]">Vitrina historica</span>
            </div>
            <CardTitle className="text-2xl">Tus hitos no se borran</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6">
              Cada medalla registra una marca real de progreso. Las desbloqueadas quedan como evidencia historica; las
              pendientes muestran exactamente cuanto falta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Desbloqueadas"
              value={String(unlocked.length)}
              hint="Hitos ya consolidados"
              tone="success"
            />
            <MetricCard
              label="Pendientes"
              value={String(locked.length)}
              hint="Objetivos todavia abiertos"
            />
            <MetricCard
              label="Mejor racha"
              value={`${stats.bestStreak} dias`}
              hint="Base real para medallas de constancia"
              tone="warning"
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/75">
          <CardHeader>
            <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-success/20 bg-success/12 text-success">
              <Target className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl">Siguiente hito</CardTitle>
            <CardDescription>
              {nextAchievement ? "El proximo desbloqueo mas cercano segun tu progreso real." : "No quedan hitos pendientes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextAchievement ? (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{nextAchievement.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{nextAchievement.description}</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-white/8">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-success to-warning transition-all"
                      style={{ width: `${Math.max(nextAchievement.progress, 6)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{nextAchievement.progressLabel}</span>
                    <span>{nextAchievement.progress}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">{remainingLabel(nextAchievement)}</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-success/20 bg-success/10 p-4 text-sm text-foreground">
                Ya desbloqueaste todos los hitos cargados en esta etapa.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {enrichedAchievements.map((achievement) => (
          <Card
            key={achievement.key}
            className={cn(
              "overflow-hidden border-border/80 bg-card/75 transition-colors",
              achievement.unlocked && "border-success/30 bg-gradient-to-br from-success/12 via-card/90 to-card/75"
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                      achievement.unlocked
                        ? "border-success/25 bg-success/12 text-success"
                        : "border-white/10 bg-white/5 text-muted-foreground"
                    )}
                  >
                    {achievement.categoryLabel}
                  </div>
                  <CardTitle className="text-xl">{achievement.title}</CardTitle>
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                    achievement.unlocked ? "bg-success/12 text-success" : "bg-white/6 text-muted-foreground"
                  )}
                >
                  {achievement.unlocked ? <Trophy className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                  {achievement.unlocked ? "Desbloqueada" : "Pendiente"}
                </div>
              </div>
              <CardDescription className="max-w-xl text-sm leading-6">{achievement.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Flame className="h-4 w-4 text-success" />
                    Progreso actual
                  </div>
                  <p className="text-lg font-semibold text-foreground">{achievement.progressLabel}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{remainingLabel(achievement)}</p>
                </div>
                <div className="rounded-3xl border border-white/8 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Avance</span>
                    <span>{achievement.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/8">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        achievement.unlocked ? "bg-success" : "bg-gradient-to-r from-success to-warning"
                      )}
                      style={{ width: `${Math.max(achievement.progress, achievement.unlocked ? 100 : 4)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {achievement.unlocked
                      ? "Queda guardada como hito historico aunque luego cambie tu ritmo."
                      : "Se actualiza automaticamente con tus registros y estadisticas."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
