import { AchievementType, PlanMode, Prisma } from '@prisma/client';

export const defaultProfile = {
  timezone: 'America/Argentina/Buenos_Aires',
  planMode: PlanMode.REDUCE,
  baselineDailyConsumption: 8,
  dailyGoal: 3,
  packPrice: new Prisma.Decimal(4500),
  monthlyFreeDays: 4,
  onboardingCompletedAt: null,
};

export const defaultAchievements = [
  {
    key: 'first-smoke-free-day',
    title: 'Primer dia sin fumar',
    description: 'Primer registro diario con consumo 0.',
    type: AchievementType.SMOKE_FREE_DAYS,
    threshold: 1,
  },
  {
    key: 'three-smoke-free-days',
    title: 'Tres dias limpios',
    description: 'Acumular 3 dias con consumo 0.',
    type: AchievementType.SMOKE_FREE_DAYS,
    threshold: 3,
  },
  {
    key: 'seven-smoke-free-days',
    title: 'Semana limpia',
    description: 'Llegar a 7 dias sin fumar.',
    type: AchievementType.SMOKE_FREE_DAYS,
    threshold: 7,
  },
  {
    key: 'three-day-streak',
    title: 'Racha de 3 dias',
    description: 'Encadenar 3 dias exitosos.',
    type: AchievementType.STREAK,
    threshold: 3,
  },
  {
    key: 'seven-day-streak',
    title: 'Racha de 7 dias',
    description: 'Sostener una semana completa.',
    type: AchievementType.STREAK,
    threshold: 7,
  },
  {
    key: 'fourteen-day-streak',
    title: 'Racha de 14 dias',
    description: 'Sostener dos semanas completas.',
    type: AchievementType.STREAK,
    threshold: 14,
  },
  {
    key: 'thirty-day-streak',
    title: 'Racha de 30 dias',
    description: 'Alcanzar un mes entero de continuidad.',
    type: AchievementType.STREAK,
    threshold: 30,
  },
  {
    key: 'first-savings',
    title: 'Primer ahorro serio',
    description: 'Acumular $10.000 de ahorro.',
    type: AchievementType.MONEY_SAVED,
    threshold: 10000,
  },
  {
    key: 'major-savings',
    title: 'Ahorro mayor',
    description: 'Acumular $50.000 de ahorro.',
    type: AchievementType.MONEY_SAVED,
    threshold: 50000,
  },
  {
    key: 'hundred-avoided',
    title: '100 cigarrillos evitados',
    description: 'Hito acumulado de reduccion.',
    type: AchievementType.CIGARETTES_AVOIDED,
    threshold: 100,
  },
  {
    key: 'three-hundred-avoided',
    title: '300 cigarrillos evitados',
    description: 'Reduccion acumulada cada vez mas visible.',
    type: AchievementType.CIGARETTES_AVOIDED,
    threshold: 300,
  },
];
