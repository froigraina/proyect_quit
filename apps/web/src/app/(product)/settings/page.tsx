import { SectionHeader } from "@/components/section-header";
import { SettingsForm } from "@/features/settings/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Configuracion"
        title="Motor de reglas y metricas"
        description="Configura el plan activo, la base economica y la tolerancia mensual que sostienen toda la logica del seguimiento."
      />
      <SettingsForm />
    </div>
  );
}
