-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "data" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");
