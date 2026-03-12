import { SectionHeader } from "@/components/section-header";
import { StatsLiveOverview } from "@/features/stats/components/stats-live-overview";

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Estadisticas"
        title="Lectura mensual del proceso"
        description="Comparativa contra el mes anterior, consistencia real y señales claras para ajustar el plan."
      />
      <StatsLiveOverview />
    </div>
  );
}
