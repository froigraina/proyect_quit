-- CreateTable
CREATE TABLE "ProfileSettingsSnapshot" (
    "id" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "planMode" "PlanMode" NOT NULL,
    "baselineDailyConsumption" INTEGER NOT NULL,
    "dailyGoal" INTEGER NOT NULL,
    "packPrice" DECIMAL(10,2) NOT NULL,
    "monthlyFreeDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ProfileSettingsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSettingsSnapshot_profileId_effectiveFrom_key" ON "ProfileSettingsSnapshot"("profileId", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "ProfileSettingsSnapshot" ADD CONSTRAINT "ProfileSettingsSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
