import { SectionHeader } from "@/components/section-header";
import { AchievementGalleryLive } from "@/features/achievements/components/achievement-gallery-live";

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Medallas"
        title="Vitrina de progreso"
        description="Hitos historicos que muestran lo ya consolidado y lo que tenes mas cerca de desbloquear."
      />
      <AchievementGalleryLive />
    </div>
  );
}
