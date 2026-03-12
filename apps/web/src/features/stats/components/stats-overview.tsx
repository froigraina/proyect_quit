import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Dinero ahorrado", value: "$ 18.450", detail: "Segun consumo base configurable." },
  { title: "Cigarrillos evitados", value: "123", detail: "Comparado contra linea base diaria." },
  { title: "Dias sin fumar", value: "9", detail: "Dias con registro en cero." },
  { title: "Mejor racha", value: "11", detail: "Mayor continuidad historica." }
];

export function StatsOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader>
            <CardTitle>{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
