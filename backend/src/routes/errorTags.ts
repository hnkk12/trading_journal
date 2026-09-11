import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const tagSchema = z.object({
  name: z.string().min(1),
  severity: z.number().int().min(1).max(3).default(1),
});

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const tags = await prisma.tradeErrorTag.findMany({ where: { userId: req.userId }, orderBy: { severity: "desc" } });
    res.json(tags);
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = tagSchema.parse(req.body);
    const tag = await prisma.tradeErrorTag.create({ data: { ...data, userId: req.userId! } });
    res.status(201).json(tag);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.tradeErrorTag.findFirst({ where: { id: BigInt(req.params.id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Error tag not found" });
    await prisma.tradeErrorTag.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
