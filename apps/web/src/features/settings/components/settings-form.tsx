"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CircleDollarSign, KeyRound, LoaderCircle, Settings2, ShieldCheck, Target, TimerReset, User2, Zap } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type Profile, type ProfileSettingsSnapshot } from "@/lib/api";
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function clamp(value: number, min = 0) {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.max(min, value);
}

function SettingsField({
  label,
  hint,
  children
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="rounded-3xl border border-border bg-background/60 p-4">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="mt-3">{children}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
    </label>
  );
}

export function SettingsForm() {
  const session = useSession();
  const [profile, setProfile] = useState<Profile>(fallbackProfile);
  const [history, setHistory] = useState<ProfileSettingsSnapshot[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(fallbackProfile.settingsEffectiveFrom ?? new Date().toISOString().slice(0, 10));
  const [isPending, startTransition] = useTransition();
  const [isChangingPassword, startPasswordTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextProfile, nextHistory] = await Promise.all([
          api.getProfile(),
          api.getProfileSettingsHistory()
        ]);
        if (!active) {
          return;
        }
        setProfile(nextProfile);
        setHistory(nextHistory);
        setEffectiveFrom(nextProfile.settingsEffectiveFrom ?? new Date().toISOString().slice(0, 10));
        setFeedback(null);
        setSecurityFeedback(null);
      } catch {
        if (!active) {
          return;
        }
        setFeedback("No se pudo cargar la configuracion real. Se muestra el perfil fallback.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  function updateField<Key extends keyof Profile>(key: Key, value: Profile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      try {
        const nextProfile = await api.updateProfile({
          effectiveFrom,
          planMode: profile.planMode,
          baselineDailyConsumption: profile.baselineDailyConsumption,
          dailyGoal: profile.dailyGoal,
          packPrice: profile.packPrice,
          monthlyFreeDays: profile.monthlyFreeDays
        });

        setProfile(nextProfile);
        setHistory(await api.getProfileSettingsHistory());
        setEffectiveFrom(nextProfile.settingsEffectiveFrom ?? effectiveFrom);
        setFeedback(`Configuracion guardada en modo ${nextProfile.persistenceStatus} y vigente desde ${nextProfile.settingsEffectiveFrom ?? effectiveFrom}.`);
      } catch {
        setFeedback("No se pudo guardar la configuracion.");
      }
    });
  }

  function changePassword() {
    startPasswordTransition(async () => {
      try {
        await api.changePassword({
          currentPassword,
          nextPassword
        });
        setCurrentPassword("");
        setNextPassword("");
        setSecurityFeedback("Contraseña actualizada.");
      } catch {
        setSecurityFeedback("No se pudo cambiar la contraseña. Revisá la actual.");
      }
    });
  }

  const derived = useMemo(() => {
    const packUnitPrice = profile.packPrice / 20;
    const dailySavings = Math.max(0, (profile.baselineDailyConsumption - profile.dailyGoal) * packUnitPrice);
    const monthlySavings = dailySavings * 30;
    const gapToBaseline = Math.max(0, profile.baselineDailyConsumption - profile.dailyGoal);
    const modeLabel = profile.planMode === "QUIT" ? "Dejar por completo" : "Reduccion progresiva manual";
    const strategyLabel =
      profile.planMode === "QUIT"
        ? "El objetivo ideal pasa a ser cero. Cualquier consumo por encima de cero queda fuera del plan diario."
        : "El objetivo diario actua como tope operativo y el progreso se mide contra tu linea base.";

    return {
      packUnitPrice,
      dailySavings,
      monthlySavings,
      gapToBaseline,
      modeLabel,
      strategyLabel
    };
  }, [profile.baselineDailyConsumption, profile.dailyGoal, profile.packPrice, profile.planMode]);

  const currentHistoryEntry = history[0] ?? {
    effectiveFrom: profile.settingsEffectiveFrom ?? effectiveFrom,
    planMode: profile.planMode,
    baselineDailyConsumption: profile.baselineDailyConsumption,
    dailyGoal: profile.dailyGoal,
    packPrice: profile.packPrice,
    monthlyFreeDays: profile.monthlyFreeDays
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-success/15 bg-[radial-gradient(circle_at_top_left,rgba(221,107,32,0.18),transparent_24%),linear-gradient(135deg,rgba(221,107,32,0.08),rgba(17,18,23,0.92)_42%,rgba(17,18,23,0.98))]">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-success">
              <Settings2 className="size-3.5" />
              Centro de configuracion
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Las reglas nacen aca</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Esta pantalla define como se calcula tu ahorro, que significa cumplir un dia y cuanta tolerancia mensual
                tiene tu racha. No es una preferencia cosmetica: es el motor del seguimiento.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Modo actual"
                value={profile.planMode === "QUIT" ? "Quit" : "Reduce"}
                hint={derived.modeLabel}
                tone="success"
              />
              <MetricCard
                label="Precio por cigarrillo"
                value={formatCurrency(derived.packUnitPrice)}
                hint="Se calcula como precio de caja dividido 20."
                tone="warning"
              />
              <MetricCard
                label="Reduccion objetivo"
                value={`${derived.gapToBaseline}`}
                hint="Cigarrillos menos por dia frente a tu base."
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Lectura operativa</span>
              </div>
              <p className="mt-3 text-xl font-semibold text-foreground">{derived.modeLabel}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{derived.strategyLabel}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDollarSign className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Preview economico</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(derived.dailySavings)} por dia</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(derived.monthlySavings)} estimados por mes si sostuvieras este objetivo.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Persistencia</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile.persistenceStatus}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                `connected` usa Neon/Prisma. `fallback` mantiene la app operativa sin DB.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Vigencia actual</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile.settingsEffectiveFrom ?? "Hoy"}</p>
              <p className="mt-1 text-sm text-muted-foreground">Los cambios nuevos no deberían reinterpretar días previos.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Parametros base</CardTitle>
            <CardDescription>Ajustes que modifican reglas, metricas y la interpretacion del progreso.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SettingsField
              label="Modo"
              hint="Quit enfoca abstinencia total. Reduce permite un objetivo manual por debajo de tu linea base."
            >
              <select
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                value={profile.planMode}
                onChange={(event) => updateField("planMode", event.target.value as Profile["planMode"])}
              >
                <option value="REDUCE">Reduccion progresiva manual</option>
                <option value="QUIT">Dejar por completo</option>
              </select>
            </SettingsField>

            <SettingsField
              label="Objetivo diario"
              hint="Un dia se considera exitoso si quedas en este numero o por debajo, salvo que estes en modo Quit y apuntes a cero."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="number"
                min={0}
                value={profile.dailyGoal}
                onChange={(event) => updateField("dailyGoal", clamp(Number(event.target.value)))}
              />
            </SettingsField>

            <SettingsField
              label="Consumo base"
              hint="Se usa para calcular ahorro y cigarrillos evitados. Tiene que representar tu promedio previo realista."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="number"
                min={0}
                value={profile.baselineDailyConsumption}
                onChange={(event) => updateField("baselineDailyConsumption", clamp(Number(event.target.value)))}
              />
            </SettingsField>

            <SettingsField
              label="Precio por caja"
              hint="La app divide este valor entre 20 para estimar el costo unitario de cada cigarrillo."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="number"
                min={0}
                value={profile.packPrice}
                onChange={(event) => updateField("packPrice", clamp(Number(event.target.value)))}
              />
            </SettingsField>

            <SettingsField
              label="Vigente desde"
              hint="Los cambios aplican desde esta fecha hacia adelante. Si corregís un día anterior, usa la configuración vigente de ese momento."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                max={new Date().toISOString().slice(0, 10)}
                type="date"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </SettingsField>

            <SettingsField
              label="Dias libres mensuales"
              hint="Permiten absorber incumplimientos sin cortar la racha. Se reinician al cambiar de mes."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="number"
                min={0}
                value={profile.monthlyFreeDays}
                onChange={(event) => updateField("monthlyFreeDays", clamp(Number(event.target.value)))}
              />
            </SettingsField>

            <div className="rounded-3xl border border-success/20 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success">
                <Zap className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Chequeo rapido</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {profile.dailyGoal <= profile.baselineDailyConsumption
                  ? "El objetivo esta por debajo de tu base"
                  : "El objetivo supera tu base"}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {profile.dailyGoal <= profile.baselineDailyConsumption
                  ? "Eso mantiene coherencia con la logica de ahorro y reduccion."
                  : "Conviene bajarlo: asi el objetivo vuelve a empujar progreso en vez de diluirlo."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Impacto de la configuracion</CardTitle>
            <CardDescription>Una lectura rapida para entender si el setup actual esta alineado con lo que queres lograr.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Regla diaria</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                Exito con {profile.dailyGoal} o menos cigarrillos
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Si el dia supera ese numero, solo se salva si todavia quedan dias libres.</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Linea de ahorro</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {formatCurrency(derived.packUnitPrice)} por cigarrillo
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada cigarrillo evitado frente a tu base suma ahorro sobre esa unidad.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Colchon mensual</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile.monthlyFreeDays} dias libres</p>
              <p className="mt-1 text-sm text-muted-foreground">Es tu tolerancia mensual para no cortar racha en un mal dia.</p>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Diagnostico del setup</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {derived.gapToBaseline === 0 ? "Setup neutro" : `Baja objetivo en ${derived.gapToBaseline} por dia`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {derived.gapToBaseline === 0
                  ? "No hay brecha entre base y objetivo; sirve si queres empezar midiendo antes de apretar el plan."
                  : "La diferencia entre base y objetivo ya genera reduccion medible en la app."}
              </p>
            </div>

            <div className="rounded-2xl border border-success/15 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success">
                <TimerReset className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Regla activa hoy</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                Desde {currentHistoryEntry.effectiveFrom}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentHistoryEntry.planMode === "QUIT" ? "Modo dejar por completo" : "Modo reduccion"} con objetivo de{" "}
                {currentHistoryEntry.dailyGoal}, base de {currentHistoryEntry.baselineDailyConsumption} y caja en{" "}
                {formatCurrency(currentHistoryEntry.packPrice)}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Linea de vigencias</CardTitle>
          <CardDescription>
            Historial corto de configuraciones aplicadas. Sirve para entender por que un dia viejo puede usar otro precio
            por caja u otro objetivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {history.map((entry, index) => (
            <div
              key={`${entry.effectiveFrom}-${entry.dailyGoal}-${entry.packPrice}`}
              className="grid gap-3 rounded-3xl border border-border bg-background/60 p-4 md:grid-cols-[140px_1fr_auto]"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {index === 0 ? "Activa" : "Historica"}
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">{entry.effectiveFrom}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Modo</p>
                  <p className="mt-1 text-sm text-foreground">
                    {entry.planMode === "QUIT" ? "Dejar por completo" : "Reduccion progresiva"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Precio por caja</p>
                  <p className="mt-1 text-sm text-foreground">{formatCurrency(entry.packPrice)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base diaria</p>
                  <p className="mt-1 text-sm text-foreground">{entry.baselineDailyConsumption} cigarrillos</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Objetivo diario</p>
                  <p className="mt-1 text-sm text-foreground">{entry.dailyGoal} cigarrillos</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dias libres</p>
                <p className="mt-2 text-base font-semibold text-foreground">{entry.monthlyFreeDays}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
            <CardDescription>Datos de sesión y acceso al espacio personal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User2 className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Usuario activo</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">{session.user?.displayName ?? "Cuenta"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{session.user?.email ?? "Sin email cargado"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Modelo de acceso</p>
              <p className="mt-3 text-lg font-semibold text-foreground">Email + contraseña</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Suficiente para esta etapa multiusuario chica y sin costo extra de terceros.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Cambiá la contraseña sin salir de la app.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SettingsField
              label="Contraseña actual"
              hint="La usamos para confirmar que sos vos antes de guardar el cambio."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </SettingsField>
            <SettingsField
              label="Contraseña nueva"
              hint="Usá al menos 8 caracteres. Mejor si no repetís la actual."
            >
              <input
                className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
            </SettingsField>
            <div className="md:col-span-2 rounded-3xl border border-success/20 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success">
                <KeyRound className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Recomendación</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">Mantené esta parte simple y confiable</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Para este MVP no hace falta OAuth. Una contraseña fuerte y un flujo claro ya resuelven el problema real.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button
                disabled={isChangingPassword || currentPassword.length < 8 || nextPassword.length < 8}
                onClick={changePassword}
                size="lg"
                type="button"
              >
                {isChangingPassword ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Actualizando acceso
                  </>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
              {securityFeedback ? <p className="text-sm text-muted-foreground">{securityFeedback}</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={isPending} onClick={save} size="lg" type="button">
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Guardando cambios
            </>
          ) : (
            "Guardar configuracion"
          )}
        </Button>
        {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
      </div>
    </div>
  );
}
