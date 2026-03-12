"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, LoaderCircle, PencilLine, ShieldAlert, Sparkles, TimerReset, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, type DailyEntry, type ProfileSettingsSnapshot } from "@/lib/api";

const weekDays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const todayKey = new Date().toISOString().slice(0, 10);

type CalendarCell = {
  kind: "day" | "empty";
  key: string;
  date?: string;
  day?: number;
  weekDay?: string;
  status?: DailyEntry["status"] | "EMPTY";
  cigarettesSmoked?: number | null;
  moneySaved?: number;
  cigarettesAvoided?: number;
  isFuture?: boolean;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function buildCalendar(entries: DailyEntry[], year: number, monthIndex: number): CalendarCell[] {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const offset = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const leadingEmpty = Array.from({ length: offset }, (_, index) => ({
    kind: "empty" as const,
    key: `empty-start-${index}`
  }));

  const days: CalendarCell[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
    const entry = entries.find((item) => item.date === date);

    return {
      kind: "day" as const,
      key: date,
      date,
      day,
      weekDay: weekDays[new Date(Date.UTC(year, monthIndex, day)).getUTCDay()],
      status: entry?.status ?? "EMPTY",
      cigarettesSmoked: entry?.cigarettesSmoked ?? null,
      moneySaved: entry?.moneySaved ?? 0,
      cigarettesAvoided: entry?.cigarettesAvoided ?? 0,
      isFuture: date > todayKey
    };
  });

  const trailingEmptyCount = (7 - ((leadingEmpty.length + days.length) % 7)) % 7;
  const trailingEmpty = Array.from({ length: trailingEmptyCount }, (_, index) => ({
    kind: "empty" as const,
    key: `empty-end-${index}`
  }));

  return [...leadingEmpty, ...days, ...trailingEmpty];
}

function toneForStatus(status: CalendarCell["status"], isFuture?: boolean) {
  if (isFuture) return "border-border/50 bg-background/35 text-muted-foreground/70";
  if (status === "SUCCESS") return "border-success/30 bg-success/12";
  if (status === "USED_FREE_DAY") return "border-warning/30 bg-warning/12";
  if (status === "FAILED") return "border-destructive/30 bg-destructive/10";
  return "border-border bg-background/55";
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function clamp(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function resolveSettingsForDate(history: ProfileSettingsSnapshot[], date: string | null) {
  if (!date || history.length === 0) {
    return null;
  }

  const sorted = [...history].sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom));
  return sorted.find((entry) => entry.effectiveFrom <= date) ?? sorted.at(-1) ?? null;
}

export function CalendarGridLive() {
  const initialDate = new Date();
  const [selectedYear, setSelectedYear] = useState(initialDate.getUTCFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getUTCMonth() + 1);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [settingsHistory, setSettingsHistory] = useState<ProfileSettingsSnapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editCigarettes, setEditCigarettes] = useState("0");
  const [editNotes, setEditNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadMonth(year: number, month: number) {
    const nextEntries = await api.getDailyEntries({ year, month });
    setEntries(nextEntries);

    const datesInMonth = new Set(
      buildCalendar(nextEntries, year, month - 1)
        .filter((cell) => cell.kind === "day")
        .map((cell) => cell.date)
    );

    setSelectedDate((current) => {
      if (current && datesInMonth.has(current)) {
        return current;
      }

      const visibleToday = datesInMonth.has(todayKey);
      if (visibleToday) {
        return todayKey;
      }

      return nextEntries.at(-1)?.date ?? Array.from(datesInMonth)[0] ?? null;
    });
  }

  useEffect(() => {
    let active = true;

    void Promise.all([api.getDailyEntries({ year: selectedYear, month: selectedMonth }), api.getProfileSettingsHistory()])
      .then(([nextEntries, nextHistory]) => {
        if (!active) return;
        setEntries(nextEntries);
        setSettingsHistory(nextHistory);
        const visibleDates = buildCalendar(nextEntries, selectedYear, selectedMonth - 1)
          .filter((cell) => cell.kind === "day")
          .map((cell) => cell.date as string);

        setSelectedDate((current) => {
          if (current && visibleDates.includes(current)) {
            return current;
          }

          if (visibleDates.includes(todayKey)) {
            return todayKey;
          }

          return nextEntries.at(-1)?.date ?? visibleDates[0] ?? null;
        });
        setFeedback(null);
      })
      .catch(() => {
        if (!active) return;
        setFeedback("No se pudo cargar el mes en tiempo real.");
      });

    return () => {
      active = false;
    };
  }, [selectedMonth, selectedYear]);

  const cells = useMemo(() => buildCalendar(entries, selectedYear, selectedMonth - 1), [entries, selectedMonth, selectedYear]);
  const periodLabel = monthLabel(selectedYear, selectedMonth);

  const summary = useMemo(() => {
    const successful = entries.filter((entry) => entry.status === "SUCCESS").length;
    const freeDayUsed = entries.filter((entry) => entry.status === "USED_FREE_DAY").length;
    const failed = entries.filter((entry) => entry.status === "FAILED").length;
    const moneySaved = entries.reduce((sum, entry) => sum + entry.moneySaved, 0);
    const cigarettesAvoided = entries.reduce((sum, entry) => sum + entry.cigarettesAvoided, 0);

    let currentRun = 0;
    let bestRun = 0;
    for (const entry of entries) {
      if (entry.status === "SUCCESS" || entry.status === "USED_FREE_DAY") {
        currentRun += 1;
        bestRun = Math.max(bestRun, currentRun);
      } else if (entry.status === "FAILED") {
        currentRun = 0;
      }
    }

    return { successful, freeDayUsed, failed, moneySaved, cigarettesAvoided, bestRun };
  }, [entries]);

  const selectedEntry = entries.find((entry) => entry.date === selectedDate) ?? null;
  const appliedSettings = useMemo(() => resolveSettingsForDate(settingsHistory, selectedDate), [selectedDate, settingsHistory]);
  const canEditSelected = Boolean(selectedDate && selectedDate <= todayKey);
  const completionRate = entries.length === 0 ? 0 : Math.round((summary.successful / entries.length) * 100);

  useEffect(() => {
    if (!selectedDate) {
      setEditCigarettes("0");
      setEditNotes("");
      return;
    }

    setEditCigarettes(String(selectedEntry?.cigarettesSmoked ?? 0));
    setEditNotes(selectedEntry?.notes ?? "");
  }, [selectedDate, selectedEntry]);

  function saveSelectedDate() {
    if (!selectedDate || !canEditSelected) {
      return;
    }

    startTransition(async () => {
      try {
        await api.upsertDailyEntry({
          date: selectedDate,
          cigarettesSmoked: clamp(Number(editCigarettes)),
          notes: editNotes || undefined
        });

        await loadMonth(selectedYear, selectedMonth);
        setFeedback(selectedDate === todayKey ? "Hoy quedó corregido desde calendario." : `Se guardó ${selectedDate}.`);
      } catch {
        setFeedback("No se pudo guardar ese día.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-success/15 bg-[radial-gradient(circle_at_top_left,rgba(221,107,32,0.18),transparent_26%),linear-gradient(135deg,rgba(221,107,32,0.08),rgba(17,18,23,0.92)_42%,rgba(17,18,23,0.98))]">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-success">
              <Sparkles className="size-3.5" />
              Lectura mensual
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight capitalize text-foreground">{periodLabel}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                El calendario ahora también sirve para corregir días pasados sin salir de la vista. Mirás patrón y editás sobre el mismo contexto.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-success/20 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exitosos</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{summary.successful}</p>
              </div>
              <div className="rounded-2xl border border-warning/25 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Días libres</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{summary.freeDayUsed}</p>
              </div>
              <div className="rounded-2xl border border-destructive/25 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Incumplidos</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{summary.failed}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mejor racha</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{summary.bestRun}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Rendimiento del mes</p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{completionRate}%</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-success" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impacto acumulado</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(summary.moneySaved)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{summary.cigarettesAvoided} cigarrillos evitados en este mes visible.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-2 text-success">
            <span className="size-2 rounded-full bg-success" />
            Exitoso
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-2 text-warning">
            <span className="size-2 rounded-full bg-warning" />
            Día libre
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive">
            <span className="size-2 rounded-full bg-destructive" />
            Incumplido
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[28px] border border-border/80 bg-card/75 p-4">
          <div className="mb-3 grid grid-cols-7 gap-3">
            {weekDays.map((label) => (
              <div key={label} className="px-1 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {cells.map((cell) => {
              if (cell.kind === "empty") {
                return <div key={cell.key} className="hidden rounded-2xl border border-transparent lg:block" />;
              }

              const isSelected = selectedDate === cell.date;
              return (
                <button
                  key={cell.key}
                  className={`min-h-34 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${toneForStatus(cell.status, cell.isFuture)} ${
                    isSelected ? "ring-1 ring-white/20 shadow-lg shadow-black/20" : ""
                  } ${cell.isFuture ? "opacity-60" : ""}`}
                  onClick={() => setSelectedDate(cell.date ?? null)}
                  type="button"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{cell.weekDay}</p>
                      <p className="mt-3 text-2xl font-semibold text-foreground">{String(cell.day).padStart(2, "0")}</p>
                    </div>
                    {cell.status === "SUCCESS" ? <Sparkles className="size-4 text-success" /> : null}
                    {cell.status === "USED_FREE_DAY" ? <ShieldAlert className="size-4 text-warning" /> : null}
                    {cell.status === "FAILED" ? <Flame className="size-4 text-destructive" /> : null}
                  </div>
                  <div className="mt-6 space-y-1">
                    <p className="text-sm font-medium text-foreground">{cell.isFuture ? "Bloqueado" : cell.status === "EMPTY" ? "Sin registro" : cell.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {cell.isFuture ? "No editable" : cell.cigarettesSmoked !== null ? `${cell.cigarettesSmoked} fumados` : "Sin carga"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Detalle del día</p>
              <p className="mt-3 text-xl font-semibold text-foreground">{selectedDate ?? "Seleccioná un día"}</p>
            </div>

            {selectedEntry ? (
              <>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estado</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">{selectedEntry.status}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="size-4" />
                    <span className="text-xs uppercase tracking-[0.2em]">Consumo</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground">{selectedEntry.cigarettesSmoked} cigarrillos</p>
                  <p className="mt-1 text-sm text-muted-foreground">Objetivo diario: {selectedEntry.dailyGoal}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="size-4" />
                    <span className="text-xs uppercase tracking-[0.2em]">Impacto</span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(selectedEntry.moneySaved)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedEntry.cigarettesAvoided} evitados · {selectedEntry.smokeFreeHours} h sin nicotina</p>
                </div>
                {appliedSettings ? (
                  <div className="rounded-2xl border border-success/15 bg-success/10 p-4">
                    <div className="flex items-center gap-2 text-success">
                      <TimerReset className="size-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">Regla aplicada ese día</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-foreground">Vigente desde {appliedSettings.effectiveFrom}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appliedSettings.planMode === "QUIT" ? "Modo dejar" : "Modo reducción"} · objetivo {appliedSettings.dailyGoal} · base{" "}
                      {appliedSettings.baselineDailyConsumption} · caja {formatCurrency(appliedSettings.packPrice)}.
                    </p>
                  </div>
                ) : null}
              </>
            ) : selectedDate ? (
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">Ese día todavía no tiene carga. Podés completarlo desde acá si no es futuro.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Tocá un día del calendario para ver lectura puntual o corregirlo.
              </div>
            )}

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <PencilLine className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Editar desde calendario</span>
              </div>

              {selectedDate ? (
                canEditSelected ? (
                  <div className="mt-4 space-y-3">
                    <input
                      className="w-full rounded-2xl border border-border bg-black/20 px-4 py-3 text-base font-medium text-foreground outline-none"
                      min={0}
                      type="number"
                      value={editCigarettes}
                      onChange={(event) => setEditCigarettes(event.target.value)}
                    />
                    <textarea
                      className="min-h-24 w-full resize-none rounded-2xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground outline-none"
                      placeholder="Nota opcional para corregir contexto."
                      value={editNotes}
                      onChange={(event) => setEditNotes(event.target.value)}
                    />
                    <Button className="w-full justify-center" disabled={isPending} onClick={saveSelectedDate} type="button">
                      {isPending ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Guardando cambios
                        </>
                      ) : selectedEntry ? (
                        "Guardar correccion"
                      ) : (
                        "Guardar dia"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-border bg-black/20 p-4 text-sm text-muted-foreground">
                    Los días futuros se pueden visualizar, pero no completar ni editar en esta etapa.
                  </div>
                )
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Seleccioná una fecha para activar el editor lateral.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Regla MVP</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground">
                Los días pasados y el actual se pueden corregir por error humano. Los futuros quedan bloqueados.
              </p>
              {appliedSettings && selectedDate ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Si corregís {selectedDate}, el cálculo usa la configuración vigente desde {appliedSettings.effectiveFrom}, no la de hoy.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="size-4" />
                <span className="text-xs uppercase tracking-[0.2em]">Lectura rápida</span>
              </div>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {summary.bestRun > 0 ? `Tu mejor racha visible fue de ${summary.bestRun} días.` : "Todavía no hay racha visible en este mes."}
              </p>
            </div>

            {feedback ? <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">{feedback}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
