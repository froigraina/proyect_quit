"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "./session-provider";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-5 py-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  allowOnboarding = false
}: {
  children: React.ReactNode;
  allowOnboarding?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  useEffect(() => {
    if (session.status === "loading") {
      return;
    }

    if (session.status === "anonymous") {
      router.replace("/login");
      return;
    }

    if (!session.onboardingCompleted && !allowOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (session.onboardingCompleted && pathname === "/onboarding") {
      router.replace("/today");
    }
  }, [allowOnboarding, pathname, router, session.onboardingCompleted, session.status]);

  if (session.status === "loading") {
    return <FullScreenLoader label="Restaurando sesión" />;
  }

  if (session.status === "anonymous") {
    return <FullScreenLoader label="Redirigiendo a login" />;
  }

  if (!session.onboardingCompleted && !allowOnboarding && pathname !== "/onboarding") {
    return <FullScreenLoader label="Preparando onboarding" />;
  }

  if (session.onboardingCompleted && pathname === "/onboarding") {
    return <FullScreenLoader label="Abriendo tu espacio" />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    router.replace(session.onboardingCompleted ? "/today" : "/onboarding");
  }, [router, session.onboardingCompleted, session.status]);

  if (session.status === "loading") {
    return <FullScreenLoader label="Chequeando sesión" />;
  }

  if (session.status === "authenticated") {
    return <FullScreenLoader label="Redirigiendo" />;
  }

  return <>{children}</>;
}
