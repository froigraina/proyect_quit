import Link from "next/link";
import { ArrowRight, CalendarRange, Medal, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-border bg-card/75 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-success">
            <ShieldCheck className="size-3.5" />
            Web app personal y multiusuario simple
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Seguimiento serio para dejar de fumar, pensado para usarlo todos los días desde el celular.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Cada persona entra con su cuenta, instala la app como PWA y lleva su propio progreso, objetivos, rachas,
            ahorro y medallas sin mezclar información.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Crear cuenta
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-border bg-card/80 p-5">
            <div className="flex items-center gap-3">
              <Smartphone className="size-5 text-success" />
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Uso móvil</p>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">Abrís la app y registrás el día en segundos.</p>
          </div>
          <div className="rounded-[28px] border border-border bg-card/80 p-5">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-success" />
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Ahorro real</p>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">Base configurable, precio por caja y vigencias por fecha.</p>
          </div>
          <div className="rounded-[28px] border border-border bg-card/80 p-5">
            <div className="flex items-center gap-3">
              <Medal className="size-5 text-success" />
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Progreso</p>
            </div>
            <p className="mt-4 text-lg font-semibold text-foreground">Rachas, calendario, medallas e historial de cambios.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FeatureCard
          title="Hoy"
          description="Pantalla operativa para cargar el día con la menor fricción posible."
          href="/login"
          icon={Smartphone}
        />
        <FeatureCard
          title="Calendario"
          description="Lectura mensual con edición y contexto histórico de reglas aplicadas."
          href="/login"
          icon={CalendarRange}
        />
        <FeatureCard
          title="Medallas"
          description="Hitos históricos ligados al progreso real de cada usuario."
          href="/login"
          icon={Medal}
        />
        <FeatureCard
          title="Ahorro"
          description="Seguimiento económico basado en precio por caja, objetivo y consumo base."
          href="/login"
          icon={Wallet}
        />
      </section>
    </AppShell>
  );
}
