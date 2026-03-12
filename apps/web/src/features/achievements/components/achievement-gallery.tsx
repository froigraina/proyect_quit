import { achievements } from "@/features/achievements/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AchievementGallery() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {achievements.map((achievement) => (
        <Card key={achievement.title} className={achievement.unlocked ? "border-success/30" : ""}>
          <CardHeader>
            <CardTitle>{achievement.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <p className="mt-4 text-sm font-medium text-foreground">
              {achievement.unlocked ? "Desbloqueada" : "Pendiente"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
