-- CreateEnum
CREATE TYPE "PlanMode" AS ENUM ('QUIT', 'REDUCE');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('SUCCESS', 'USED_FREE_DAY', 'FAILED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('SMOKE_FREE_DAYS', 'STREAK', 'MONEY_SAVED', 'CIGARETTES_AVOIDED');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "planMode" "PlanMode" NOT NULL DEFAULT 'REDUCE',
    "baselineDailyConsumption" INTEGER NOT NULL,
    "dailyGoal" INTEGER NOT NULL,
    "packPrice" DECIMAL(10,2) NOT NULL,
    "monthlyFreeDays" INTEGER NOT NULL DEFAULT 4,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cigarettesSmoked" INTEGER NOT NULL,
    "dailyGoal" INTEGER NOT NULL,
    "status" "EntryStatus" NOT NULL,
    "freeDayUsed" BOOLEAN NOT NULL DEFAULT false,
    "moneySaved" DECIMAL(10,2) NOT NULL,
    "cigarettesAvoided" INTEGER NOT NULL,
    "smokeFreeHours" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "DailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyAllowance" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "freeDaysLimit" INTEGER NOT NULL,
    "freeDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "MonthlyAllowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "threshold" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedAchievement" (
    "id" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievementId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "UnlockedAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_profileId_date_key" ON "DailyEntry"("profileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyAllowance_profileId_year_month_key" ON "MonthlyAllowance"("profileId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedAchievement_achievementId_profileId_key" ON "UnlockedAchievement"("achievementId", "profileId");

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyAllowance" ADD CONSTRAINT "MonthlyAllowance_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedAchievement" ADD CONSTRAINT "UnlockedAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnlockedAchievement" ADD CONSTRAINT "UnlockedAchievement_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
