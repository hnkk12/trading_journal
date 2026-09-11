-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "assetClass" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "fees" REAL NOT NULL DEFAULT 0,
    "pnl" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "timeframe" TEXT,
    "session" TEXT NOT NULL DEFAULT 'unknown',
    "followedPlan" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExecutionScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "beforeScore" REAL NOT NULL DEFAULT 0,
    "duringScore" REAL NOT NULL DEFAULT 0,
    "afterScore" REAL NOT NULL DEFAULT 0,
    "disciplineScore" REAL NOT NULL DEFAULT 0,
    "quadrant" TEXT NOT NULL DEFAULT 'plan_win',
    CONSTRAINT "ExecutionScore_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ErrorTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ErrorTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeErrorTag" (
    "tradeId" TEXT NOT NULL,
    "errorTagId" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "errorTagId"),
    CONSTRAINT "TradeErrorTag_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeErrorTag_errorTagId_fkey" FOREIGN KEY ("errorTagId") REFERENCES "ErrorTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Trade_accountId_idx" ON "Trade"("accountId");

-- CreateIndex
CREATE INDEX "Trade_entryTime_idx" ON "Trade"("entryTime");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionScore_tradeId_key" ON "ExecutionScore"("tradeId");

-- CreateIndex
CREATE INDEX "ErrorTag_userId_idx" ON "ErrorTag"("userId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");
