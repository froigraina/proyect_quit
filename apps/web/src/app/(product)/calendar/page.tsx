import { SectionHeader } from "@/components/section-header";
import { CalendarGridLive } from "@/features/calendar/components/calendar-grid-live";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Calendario"
        title="Progreso mensual"
        description="Estado visual por dia para leer rachas y desbordes rapidamente."
      />
      <CalendarGridLive />
    </div>
  );
}
