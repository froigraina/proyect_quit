import { MetricCard } from "@/components/metric-card";
import { dashboardMetrics } from "@/features/dashboard/data";

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {dashboardMetrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}
