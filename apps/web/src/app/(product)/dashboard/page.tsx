import { SectionHeader } from "@/components/section-header";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dashboard"
        title="Resumen operativo"
        description="Vista de lectura: rachas, ahorro, direccion del proceso y accesos rapidos."
      />
      <DashboardOverview />
    </div>
  );
}
