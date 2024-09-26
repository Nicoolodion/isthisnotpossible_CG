-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cracked" BOOLEAN NOT NULL,
    "reason" TEXT,
    "platform" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingGame" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cracked" BOOLEAN NOT NULL,
    "reason" TEXT,
    "platform" TEXT,

    CONSTRAINT "PendingGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadInfo" (
    "thread_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,

    CONSTRAINT "ThreadInfo_pkey" PRIMARY KEY ("thread_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PendingGame_name_key" ON "PendingGame"("name");
