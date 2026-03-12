import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon
}: {
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-border bg-card/60 p-6 transition hover:-translate-y-0.5 hover:border-success/30"
    >
      <div className="flex items-center justify-between">
        <Icon className="size-5 text-success" />
        <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
