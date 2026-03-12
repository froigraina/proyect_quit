"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { useSession } from "../session-provider";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const session = useSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const copy = useMemo(() => {
    if (mode === "register") {
      return {
        eyebrow: "Cuenta nueva",
        title: "Abrí tu espacio personal",
        description: "Cada persona lleva su propio progreso, sin mezclar registros ni métricas.",
        submitLabel: "Crear cuenta",
        alternateLabel: "Ya tengo cuenta",
        alternateHref: "/login" as Route
      };
    }

    return {
      eyebrow: "Volver a entrar",
      title: "Entrá directo a tu seguimiento",
      description: "La sesión te devuelve a tu plan, tus métricas y tu historial desde el celular.",
      submitLabel: "Iniciar sesión",
      alternateLabel: "Crear cuenta",
      alternateHref: "/register" as Route
    };
  }, [mode]);

  function submit() {
    startTransition(async () => {
      try {
        setFeedback(null);
        if (mode === "register") {
          await session.register({ displayName, email, password });
        } else {
          await session.login({ email, password });
        }

        router.replace("/onboarding");
      } catch (error) {
        if (error instanceof ApiError) {
          if (mode === "register" && error.status === 409) {
            setFeedback("Ya existe una cuenta con ese email. Probá iniciar sesión.");
            return;
          }

          if (mode === "login" && error.status === 401) {
            setFeedback("Email o contraseña incorrectos.");
            return;
          }

          if (mode === "register" && error.status === 400) {
            setFeedback("Revisá los datos. La contraseña debe tener al menos 8 caracteres.");
            return;
          }

          setFeedback(error.message);
          return;
        }

        setFeedback(mode === "register" ? "No se pudo crear la cuenta." : "No se pudo iniciar sesión.");
      }
    });
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <Card className="overflow-hidden border-success/15 bg-[radial-gradient(circle_at_top_left,rgba(221,107,32,0.2),transparent_30%),linear-gradient(180deg,rgba(16,16,20,0.96),rgba(8,8,10,0.98))]">
        <CardContent className="flex h-full flex-col justify-between p-6 sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-success">
              <ShieldCheck className="size-3.5" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{copy.title}</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">{copy.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PWA</p>
              <p className="mt-2 text-sm text-foreground">Pensada para uso diario desde el celu.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Separada</p>
              <p className="mt-2 text-sm text-foreground">Cada persona mantiene su propia info.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Simple</p>
              <p className="mt-2 text-sm text-foreground">Email, contraseña y listo.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/85">
        <CardContent className="space-y-4 p-6 sm:p-8">
          {mode === "register" ? (
            <label className="block rounded-3xl border border-border bg-background/60 p-4">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Nombre visible</span>
              <input
                className="mt-3 w-full bg-transparent text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
                placeholder="Fran, Mati, etc."
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          ) : null}

          <label className="block rounded-3xl border border-border bg-background/60 p-4">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</span>
            <input
              className="mt-3 w-full bg-transparent text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              inputMode="email"
              placeholder="vos@correo.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block rounded-3xl border border-border bg-background/60 p-4">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Contraseña</span>
            <input
              className="mt-3 w-full bg-transparent text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
              placeholder="Mínimo 8 caracteres"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="sticky bottom-4 space-y-3 rounded-[28px] border border-border bg-card/95 p-4 backdrop-blur">
            <Button
              className="h-12 w-full justify-center text-base"
              disabled={isPending || !email || password.length < 8 || (mode === "register" && displayName.trim().length < 2)}
              onClick={submit}
              type="button"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Procesando
                </>
              ) : (
                <>
                  {copy.submitLabel}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link className="text-foreground underline" href={copy.alternateHref}>
                {copy.alternateLabel}
              </Link>
            </p>
            {feedback ? <p className="text-center text-sm text-muted-foreground">{feedback}</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
