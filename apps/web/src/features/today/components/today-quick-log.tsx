"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRight, CheckCircle2, Flame, LoaderCircle, Minus, Sparkles, Target, Wallet, Zap } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
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
  smokeFreeHours: 0,
  currentStreak: 1,
  bestStreak: 1,
  monthlyFreeDaysRemaining: 3
};

const todayKey = new Date().toISOString().slice(0, 10);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function clamp(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export function TodayQuickLog() {
  const [profile, setProfile] = useState(fallbackProfile);
  const [stats, setStats] = useState(fallbackStats);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [cigarettesSmoked, setCigarettesSmoked] = useState("0");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextProfile, nextStats, entries] = await Promise.all([api.getProfile(), api.getStats(), api.getDailyEntries()]);
        if (!active) return;
        const entry = entries.find((item) => item.date === todayKey) ?? null;
        setProfile(nextProfile);
        setStats(nextStats);
        setTodayEntry(entry);
        setCigarettesSmoked(String(entry?.cigarettesSmoked ?? 0));
        setNotes(entry?.notes ?? "");
        setFeedback(null);
      } catch {
        if (!active) return;
        setFeedback("No se pudo cargar el estado real. Se muestra modo fallback.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const parsedCigarettes = clamp(Number(cigarettesSmoked));
  const livePreview = useMemo(() => {
    const perCigarette = profile.packPrice / 20;
    const cigarettesAvoided = Math.max(0, profile.baselineDailyConsumption - parsedCigarettes);
    const estimatedSavings = cigarettesAvoided * perCigarette;
    const isWithinGoal = parsedCigarettes <= profile.dailyGoal;
    const statusLabel =
      parsedCigarettes === 0
        ? "Dia limpio"
        : isWithinGoal
          ? "Dentro del objetivo"
          : "Probable uso de dia libre o incumplimiento";

    return {
      cigarettesAvoided,
      estimatedSavings,
      statusLabel,
      isWithinGoal
    };
  }, [parsedCigarettes, profile.baselineDailyConsumption, profile.dailyGoal, profile.packPrice]);

  const quickActions = [
    { label: "Cero", value: 0 },
    { label: "Objetivo", value: profile.dailyGoal },
    { label: "Objetivo +1", value: profile.dailyGoal + 1 },
    { label: "Base", value: profile.baselineDailyConsumption }
  ];

  function setQuickValue(value: number) {
    setCigarettesSmoked(String(clamp(value)));
  }

  function adjustValue(delta: number) {
    setCigarettesSmoked(String(clamp(parsedCigarettes + delta)));
  }

  function submit() {
    startTransition(async () => {
      try {
        await api.upsertDailyEntry({
          date: todayKey,
          cigarettesSmoked: parsedCigarettes,
          notes: notes || undefined
        });
        const [nextStats, entries] = await Promise.all([api.getStats(), api.getDailyEntries()]);
        const entry = entries.find((item) => item.date === todayKey) ?? null;
        setStats(nextStats);
        setTodayEntry(entry);
        setFeedback("Hoy quedó actualizado.");
      } catch {
        setFeedback("No se pudo guardar el día de hoy.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-success/20 bg-gradient-to-br from-success/12 via-card/90 to-card/70">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-success">
              <Sparkles className="size-3.5" />
              Daily driver
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Abrir, tocar, guardar.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Esta vista queda optimizada para registrar hoy en segundos. El objetivo es bajar fricción, no pedirte
                atención extra.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Fecha" value={todayKey} hint="Carga operativa del día actual." />
              <MetricCard label="Racha actual" value={`${stats.currentStreak} dias`} hint="Se actualiza al guardar." tone="success" />
              <MetricCard label="Dias libres" value={`${stats.monthlyFreeDaysRemaining}`} hint="Margen restante del mes." tone="warning" />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-success/20 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado de hoy</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{todayEntry?.status ?? "Todavia no cargado"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {todayEntry ? `${todayEntry.cigarettesSmoked} fumados · ${todayEntry.cigarettesAvoided} evitados` : "Cargá el dato y la app recalcula sola."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview inmediato</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{livePreview.statusLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {livePreview.cigarettesAvoided} evitados · {formatCurrency(livePreview.estimatedSavings)} estimados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Cargar hoy</CardTitle>
            <CardDescription>Atajos rápidos, control manual y una sola acción final.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm font-medium text-foreground transition hover:border-success/30"
                  onClick={() => setQuickValue(action.value)}
                  type="button"
                >
                  <span className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">{action.label}</span>
                  <span className="mt-2 block text-xl font-semibold">{action.value}</span>
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cigarrillos fumados hoy</p>
                  <p className="mt-2 text-5xl font-semibold tracking-tight text-foreground">{parsedCigarettes}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => adjustValue(-1)} size="lg" type="button" variant="secondary">
                    <Minus className="size-4" />
                  </Button>
                  <Button onClick={() => adjustValue(1)} size="lg" type="button" variant="secondary">
                    <Zap className="size-4" />
                  </Button>
                </div>
              </div>
              <input
                className="mt-4 w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-xl font-medium text-foreground outline-none"
                inputMode="numeric"
                min={0}
                type="number"
                value={cigarettesSmoked}
                onChange={(event) => setCigarettesSmoked(event.target.value)}
              />
            </div>

            <label className="block rounded-2xl border border-border bg-background/60 p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nota opcional</span>
              <textarea
                className="mt-3 min-h-24 w-full resize-none bg-transparent text-base text-foreground outline-none"
                placeholder="Sólo si querés dejar contexto del día."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            <Button className="w-full justify-center" disabled={isPending} onClick={submit} size="lg" type="button">
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Guardando cambios
                </>
              ) : (
                <>
                  {todayEntry ? "Actualizar hoy" : "Guardar hoy"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {feedback ? (
              <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">{feedback}</div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Lectura instantanea</CardTitle>
            <CardDescription>Confirmación rápida para no tener que ir al dashboard después de cada carga.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Resultado probable</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{livePreview.statusLabel}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Ahorro estimado hoy</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(livePreview.estimatedSavings)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Comparación con objetivo</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {parsedCigarettes <= profile.dailyGoal ? "Dentro del plan" : `${parsedCigarettes - profile.dailyGoal} por encima`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Objetivo diario actual: {profile.dailyGoal}.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Cigarrillos evitados</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{livePreview.cigarettesAvoided}</p>
              <p className="mt-1 text-sm text-muted-foreground">Contra la línea base configurada de {profile.baselineDailyConsumption}.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
