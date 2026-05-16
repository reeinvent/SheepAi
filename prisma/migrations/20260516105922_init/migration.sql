-- CreateTable
CREATE TABLE "RawIngestorOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dataSource" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "metadata" TEXT,
    "ticketId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RawIngestorOutput_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RawIngestorOutput_dataSource_idx" ON "RawIngestorOutput"("dataSource");

-- CreateIndex
CREATE INDEX "RawIngestorOutput_ticketId_idx" ON "RawIngestorOutput"("ticketId");

-- CreateIndex
CREATE INDEX "RawIngestorOutput_timestamp_idx" ON "RawIngestorOutput"("timestamp");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");
