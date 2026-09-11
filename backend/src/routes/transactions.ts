import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const txSchema = z.object({
  accountId: z.string(),
  type: z.enum(["deposit", "withdraw"]),
  amount: z.number().positive(),
  date: z.coerce.date().default(() => new Date()),
  note: z.string().optional(),
});

async function assertAccountOwnership(accountId: bigint, userId: bigint) {
  return prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
}

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const accounts = await prisma.tradingAccount.findMany({ where: { userId: req.userId }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);
    const queryAccountId = req.query.accountId as string | undefined;
    const transactions = await prisma.tradingAccountTransaction.findMany({
      where: { accountId: queryAccountId ? BigInt(queryAccountId) : { in: accountIds } },
      orderBy: { occurredAt: "desc" },
    });
    res.json(transactions);
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = txSchema.parse(req.body);
    const accountId = BigInt(data.accountId);
    const account = await assertAccountOwnership(accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Account not found" });
    const tx = await prisma.tradingAccountTransaction.create({
      data: { accountId, type: data.type, amount: data.amount, occurredAt: data.date, note: data.note },
    });
    res.status(201).json(tx);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.tradingAccountTransaction.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Transaction not found" });
    const account = await assertAccountOwnership(existing.accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Transaction not found" });
    const data = txSchema.partial().parse(req.body);
    const tx = await prisma.tradingAccountTransaction.update({
      where: { id: existing.id },
      data: {
        ...(data.accountId && { accountId: BigInt(data.accountId) }),
        ...(data.type && { type: data.type }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.date && { occurredAt: data.date }),
        ...(data.note !== undefined && { note: data.note }),
      },
    });
    res.json(tx);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.tradingAccountTransaction.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Transaction not found" });
    const account = await assertAccountOwnership(existing.accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Transaction not found" });
    await prisma.tradingAccountTransaction.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
