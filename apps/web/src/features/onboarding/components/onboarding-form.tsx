"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CigaretteOff, LoaderCircle, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Profile } from "@/lib/api";
import { useSession } from "@/features/auth/session-provider";

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

const totalSteps = 3;

function clamp(value: number, min = 0) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, value);
}

export function OnboardingForm() {
  const router = useRouter();
  const session = useSession();
  const [profile, setProfile] = useState(fallbackProfile);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    void api
      .getProfile()
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const derived = useMemo(() => {
    const pricePerCigarette = profile.packPrice / 20;
    const projectedSavings = Math.max(0, (profile.baselineDailyConsumption - profile.dailyGoal) * pricePerCigarette * 30);

    return {
      pricePerCigarette,
      projectedSavings
    };
  }, [profile.baselineDailyConsumption, profile.dailyGoal, profile.packPrice]);

  function updateField<Key extends keyof Profile>(key: Key, value: Profile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updatePlanMode(nextMode: Profile["planMode"]) {
    setProfile((current) => ({
      ...current,
      planMode: nextMode,
      dailyGoal: nextMode === "QUIT" ? 0 : current.dailyGoal === 0 ? 1 : current.dailyGoal
    }));
  }

  function submit() {
    startTransition(async () => {
      try {
        await api.completeOnboarding({
          planMode: profile.planMode,
          baselineDailyConsumption: profile.baselineDailyConsumption,
          dailyGoal: profile.dailyGoal,
          packPrice: profile.packPrice,
          monthlyFreeDays: profile.monthlyFreeDays
        });
        await session.refresh();
        router.replace("/today");
      } catch {
        setFeedback("No se pudo completar el onboarding.");
      }
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="overflow-hidden border-success/15 bg-[radial-gradient(circle_at_top_left,rgba(221,107,32,0.2),transparent_30%),linear-gradient(180deg,rgba(16,16,20,0.96),rgba(8,8,10,0.98))]">
        <CardContent className="space-y-5 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-success">
            <ShieldCheck className="size-3.5" />
            Paso {step + 1} de {totalSteps}
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Dejemos listo tu plan en menos de un minuto</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Lo importante ahora es que la app entienda cómo querés dejar de fumar y cómo medir tu ahorro real desde el celular.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-3xl border border-border bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modo elegido</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {profile.planMode === "QUIT" ? "Dejar por completo" : "Reducción progresiva"}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Objetivo actual</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{profile.dailyGoal} cigarrillos por día</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="size-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Proyección simple</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">${Math.round(derived.projectedSavings).toLocaleString("es-AR")} por mes</p>
              <p className="mt-1 text-sm text-muted-foreground">Estimado usando tu base, tu objetivo y el precio por caja configurado.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/85">
        <CardContent className="space-y-5 p-5 sm:p-8">
          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">1. Tipo de plan</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">¿Querés cortar o bajar gradualmente?</h3>
              </div>
              <div className="grid gap-3">
                <button
                  className={`rounded-3xl border p-5 text-left ${profile.planMode === "QUIT" ? "border-success/35 bg-success/10" : "border-border bg-background/60"}`}
                  onClick={() => updatePlanMode("QUIT")}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <CigaretteOff className="size-5 text-success" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">Dejar por completo</p>
                      <p className="text-sm text-muted-foreground">Tu día ideal es 0. Cualquier consumo queda fuera del plan diario.</p>
                    </div>
                  </div>
                </button>
                <button
                  className={`rounded-3xl border p-5 text-left ${profile.planMode === "REDUCE" ? "border-success/35 bg-success/10" : "border-border bg-background/60"}`}
                  onClick={() => updatePlanMode("REDUCE")}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight className="size-5 text-success" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">Reducción progresiva</p>
                      <p className="text-sm text-muted-foreground">Te marcás un tope manual y lo vas bajando a tu ritmo.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">2. Tu punto de partida</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">Necesitamos una base realista</h3>
              </div>

              <label className="block rounded-3xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Consumo base diario</span>
                <input
                  className="mt-3 w-full bg-transparent text-3xl font-semibold text-foreground outline-none"
                  min={0}
                  type="number"
                  value={profile.baselineDailyConsumption}
                  onChange={(event) => updateField("baselineDailyConsumption", clamp(Number(event.target.value)))}
                />
                <p className="mt-2 text-sm text-muted-foreground">Tu promedio antes de empezar a bajar.</p>
              </label>

              <label className="block rounded-3xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Objetivo diario</span>
                <input
                  className="mt-3 w-full bg-transparent text-3xl font-semibold text-foreground outline-none"
                  min={0}
                  type="number"
                  value={profile.planMode === "QUIT" ? 0 : profile.dailyGoal}
                  onChange={(event) => updateField("dailyGoal", clamp(Number(event.target.value)))}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {profile.planMode === "QUIT" ? "En modo dejar, lo lógico es apuntar a 0." : "Un día cuenta si quedás en este número o por debajo."}
                </p>
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">3. Economía y tolerancia</p>
                <h3 className="mt-2 text-2xl font-semibold text-foreground">Terminemos las reglas de medición</h3>
              </div>

              <label className="block rounded-3xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Precio por caja</span>
                <input
                  className="mt-3 w-full bg-transparent text-3xl font-semibold text-foreground outline-none"
                  min={0}
                  type="number"
                  value={profile.packPrice}
                  onChange={(event) => updateField("packPrice", clamp(Number(event.target.value)))}
                />
                <p className="mt-2 text-sm text-muted-foreground">La app divide este valor entre 20 para estimar el precio por cigarrillo.</p>
              </label>

              <label className="block rounded-3xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Días libres por mes</span>
                <input
                  className="mt-3 w-full bg-transparent text-3xl font-semibold text-foreground outline-none"
                  min={0}
                  type="number"
                  value={profile.monthlyFreeDays}
                  onChange={(event) => updateField("monthlyFreeDays", clamp(Number(event.target.value)))}
                />
                <p className="mt-2 text-sm text-muted-foreground">Sirven para no cortar la racha cuando te pasás, hasta agotar el cupo del mes.</p>
              </label>
            </div>
          ) : null}

          <div className="sticky bottom-4 space-y-3 rounded-[28px] border border-border bg-card/95 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <Button disabled={step === 0 || isPending} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button" variant="ghost">
                <ArrowLeft className="size-4" />
                Atrás
              </Button>

              {step < totalSteps - 1 ? (
                <Button onClick={() => setStep((current) => Math.min(totalSteps - 1, current + 1))} type="button">
                  Siguiente
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button className="min-w-40" disabled={isPending} onClick={submit} type="button">
                  {isPending ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Creando plan
                    </>
                  ) : (
                    "Entrar a Hoy"
                  )}
                </Button>
              )}
            </div>
            {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
