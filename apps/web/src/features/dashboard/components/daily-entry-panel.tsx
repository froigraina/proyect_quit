import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DailyEntryPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro diario minimo</CardTitle>
        <CardDescription>En el MVP el dato central del dia es fecha + cantidad de cigarrillos fumados.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Fecha</p>
          <p className="mt-2 text-base font-medium text-foreground">2026-03-11</p>
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-4">
          <p className="text-sm text-muted-foreground">Cigarrillos fumados</p>
          <p className="mt-2 text-base font-medium text-foreground">2</p>
        </div>
        <div className="rounded-2xl border border-success/20 bg-success/10 p-4">
          <p className="text-sm text-success">Estado</p>
          <p className="mt-2 text-base font-medium text-foreground">Cumple objetivo diario</p>
        </div>
      </CardContent>
    </Card>
  );
}
