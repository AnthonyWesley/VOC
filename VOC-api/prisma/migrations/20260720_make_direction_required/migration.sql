-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FinancialRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" TEXT NOT NULL,
    "memberId" TEXT,
    "eventId" TEXT,
    "recordedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reversalOfId" TEXT,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "cancelledAt" DATETIME,
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "reversedAt" DATETIME,
    "reversedById" TEXT,
    "reverseReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "FinancialRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FinancialRecord_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialRecord" ("amount", "cancelReason", "cancelledAt", "cancelledById", "categoryId", "createdAt", "date", "description", "direction", "eventId", "id", "memberId", "method", "recordedById", "reversalOfId", "reverseReason", "reversedAt", "reversedById", "status", "updatedAt") SELECT "amount", "cancelReason", "cancelledAt", "cancelledById", "categoryId", "createdAt", "date", "description", "direction", "eventId", "id", "memberId", "method", "recordedById", "reversalOfId", "reverseReason", "reversedAt", "reversedById", "status", "updatedAt" FROM "FinancialRecord";
DROP TABLE "FinancialRecord";
ALTER TABLE "new_FinancialRecord" RENAME TO "FinancialRecord";
CREATE UNIQUE INDEX "FinancialRecord_reversalOfId_key" ON "FinancialRecord"("reversalOfId");
CREATE INDEX "FinancialRecord_date_idx" ON "FinancialRecord"("date");
CREATE INDEX "FinancialRecord_status_idx" ON "FinancialRecord"("status");
CREATE INDEX "FinancialRecord_categoryId_idx" ON "FinancialRecord"("categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
