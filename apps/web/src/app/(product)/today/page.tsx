import { SectionHeader } from "@/components/section-header";
import { TodayQuickLog } from "@/features/today/components/today-quick-log";

export default function TodayPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Hoy"
        title="Carga diaria rapida"
        description="La pantalla operativa principal: registrar el dia de hoy con la menor friccion posible."
      />
      <TodayQuickLog />
    </div>
  );
}
