-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "broker" TEXT,
    "assetClass" TEXT NOT NULL,
    "marketType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "initialBalance" REAL NOT NULL DEFAULT 0,
    "riskPerTradeAmount" REAL NOT NULL DEFAULT 0,
    "riskPerTradePercent" REAL NOT NULL DEFAULT 0,
    "leverage" REAL NOT NULL DEFAULT 1,
    "maintenanceMarginRate" REAL NOT NULL DEFAULT 0.005,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("assetClass", "broker", "createdAt", "currency", "id", "initialBalance", "marketType", "name", "riskPerTradeAmount", "riskPerTradePercent", "userId") SELECT "assetClass", "broker", "createdAt", "currency", "id", "initialBalance", "marketType", "name", "riskPerTradeAmount", "riskPerTradePercent", "userId" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
