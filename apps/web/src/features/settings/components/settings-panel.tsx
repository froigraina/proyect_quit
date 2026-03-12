import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  { label: "Modo", value: "Reduccion progresiva manual" },
  { label: "Objetivo diario", value: "3 cigarrillos" },
  { label: "Consumo base", value: "8 cigarrillos por dia" },
  { label: "Precio por caja", value: "$ 4.500" },
  { label: "Dias libres por mes", value: "4" }
];

export function SettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracion base del perfil</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {settings.map((setting) => (
          <div key={setting.label} className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-sm text-muted-foreground">{setting.label}</p>
            <p className="mt-2 text-base font-medium text-foreground">{setting.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
