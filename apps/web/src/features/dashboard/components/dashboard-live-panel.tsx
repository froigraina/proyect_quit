"use client";

import { useEffect, useState, useTransition } from "react";
import { CalendarDays, Flame, LoaderCircle, Sparkles, Wallet } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type DailyEntry, type StatsSummary } from "@/lib/api";

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
    id: "fallback-1",
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
    id: "fallback-2",
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

export function DashboardLivePanel() {
  const [stats, setStats] = useState<StatsSummary>(fallbackStats);
  const [entries, setEntries] = useState<DailyEntry[]>(fallbackEntries);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [cigarettesSmoked, setCigarettesSmoked] = useState("0");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [nextStats, nextEntries] = await Promise.all([api.getStats(), api.getDailyEntries()]);
        if (!active) return;
        setStats(nextStats);
        setEntries(nextEntries);
      } catch {
        if (!active) return;
        setFeedback("API no disponible. Se muestran datos fallback.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const metrics = [
    { label: "Dias sin fumar", value: `${stats.smokeFreeDays}`, hint: "Acumulado historico", tone: "success" as const },
    { label: "Mejor racha", value: `${stats.bestStreak} dias`, hint: "Maximo alcanzado", tone: "default" as const },
    { label: "Horas sin nicotina", value: `${stats.smokeFreeHours} h`, hint: "Logica diaria simple", tone: "default" as const },
    {
      label: "Dias libres del mes",
      value: `${stats.monthlyFreeDaysRemaining}`,
      hint: "Disponibles para sostener racha",
      tone: stats.monthlyFreeDaysRemaining > 1 ? ("success" as const) : ("warning" as const)
    }
  ];

  const latestEntry = entries.at(-1);
  const selectedEntry = entries.find((entry) => entry.date === entryDate);
  const isFutureDate = new Date(entryDate).getTime() > new Date(new Date().toISOString().slice(0, 10)).getTime();
  const statusTone =
    selectedEntry?.status === "SUCCESS"
      ? "border-success/25 bg-success/10"
      : selectedEntry?.status === "USED_FREE_DAY"
        ? "border-warning/25 bg-warning/10"
        : "border-border bg-background/60";

  function hydrateFormFromEntry(date: string, nextEntries: DailyEntry[]) {
    const existing = nextEntries.find((entry) => entry.date === date);
    if (!existing) {
      setCigarettesSmoked("0");
      setNotes("");
      return;
    }

    setCigarettesSmoked(String(existing.cigarettesSmoked));
    setNotes(existing.notes ?? "");
  }

  function submitEntry() {
    startTransition(async () => {
      try {
        await api.upsertDailyEntry({
          date: entryDate,
          cigarettesSmoked: Number(cigarettesSmoked),
          notes: notes || undefined
        });
        const [nextStats, nextEntries] = await Promise.all([api.getStats(), api.getDailyEntries()]);
        setStats(nextStats);
        setEntries(nextEntries);
        hydrateFormFromEntry(entryDate, nextEntries);
        setFeedback("Registro diario actualizado.");
      } catch {
        setFeedback("No se pudo persistir el registro diario.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-success/15 bg-gradient-to-br from-success/10 via-card/90 to-card/70">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-success">
              <Sparkles className="size-3.5" />
              En foco hoy
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Cargar el dia deberia llevarte menos de 20 segundos.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Elegi la fecha, anotá cuántos fumaste y corregí rápido si hubo error humano. El resto de las métricas se recalcula solo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-background/55 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">Fecha activa</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{entryDate}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/55 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="size-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">Consumo</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{cigarettesSmoked} cigarrillos</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background/55 p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="size-4" />
                  <span className="text-xs uppercase tracking-[0.2em]">Ahorro total</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-foreground">{formatCurrency(stats.moneySaved)}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-2xl border border-success/20 bg-background/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ultimo registro</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{latestEntry?.date ?? "Todavia no cargaste dias"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {latestEntry ? `${latestEntry.cigarettesSmoked} fumados · ${latestEntry.status}` : "Cargá el primero para activar racha y métricas."}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Siguiente micro-objetivo</p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {stats.smokeFreeHours === 24 ? "Convertir mañana en otro dia limpio" : "Cerrar hoy dentro del objetivo diario"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">La pantalla busca que siempre tengas una accion clara, no solo métricas.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Registro diario real</CardTitle>
          <CardDescription>Registrá o corregí un dia pasado. Los dias futuros quedan bloqueados por regla de negocio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="rounded-2xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fecha</span>
                <input
                  className="mt-3 w-full rounded-xl bg-transparent text-base font-medium text-foreground outline-none"
                  max={new Date().toISOString().slice(0, 10)}
                  type="date"
                  value={entryDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setEntryDate(nextDate);
                    hydrateFormFromEntry(nextDate, entries);
                  }}
                />
              </label>
              <label className="rounded-2xl border border-border bg-background/60 p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cigarrillos fumados</span>
                <input
                  className="mt-3 w-full rounded-xl bg-transparent text-3xl font-semibold text-foreground outline-none"
                  inputMode="numeric"
                  min={0}
                  type="number"
                  value={cigarettesSmoked}
                  onChange={(event) => setCigarettesSmoked(event.target.value)}
                />
              </label>
              <div className={`rounded-2xl border p-4 ${statusTone}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estado para esta fecha</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{selectedEntry?.status ?? "Sin registro"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedEntry ? `${selectedEntry.cigarettesAvoided} evitados · ${formatCurrency(selectedEntry.moneySaved)}` : "Todavia no hay datos cargados."}
                </p>
              </div>
            </div>

            <label className="rounded-2xl border border-border bg-background/60 p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notas opcionales</span>
              <textarea
                className="mt-3 min-h-24 w-full resize-none rounded-xl bg-transparent text-base font-medium text-foreground outline-none"
                placeholder="Ejemplo: noche complicada, pero dentro del objetivo."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {isFutureDate
                  ? "Los dias futuros no se pueden completar ni editar."
                  : "Si elegís un dia ya cargado, el formulario se autocompleta para corregirlo."}
              </div>
              <Button disabled={isPending || isFutureDate} onClick={submitEntry} type="button">
                {isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando cambios
                  </>
                ) : selectedEntry ? (
                  "Actualizar dia"
                ) : (
                  "Guardar registro"
                )}
              </Button>
            </div>

            {feedback ? (
              <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">{feedback}</div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Ultimos registros</p>
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{entries.length} cargados</span>
            </div>
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Todavia no hay historial. Cargá tu primer dia para empezar a medir progreso real.
              </div>
            ) : null}
            {entries.slice(-6).reverse().map((entry) => (
              <button
                key={entry.id}
                className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-4 py-3 text-left transition hover:border-success/30 hover:bg-card"
                onClick={() => {
                  setEntryDate(entry.date);
                  hydrateFormFromEntry(entry.date, entries);
                }}
                type="button"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.date}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.cigarettesSmoked} fumados · objetivo {entry.dailyGoal}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{entry.status}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(entry.moneySaved)}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
