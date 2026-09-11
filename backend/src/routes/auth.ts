import { Router } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

// No /register or /login here anymore — accounts are created and
// authenticated on hkfin. This endpoint just resolves the identity carried
// by the hkfin JWT (see middleware/auth.ts) against the shared users table.
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (user) {
        return res.json({ id: user.id.toString(), email: user.email, name: user.name });
      }
    } catch {
      // Bỏ qua lỗi DB nếu chưa kết nối được
    }
    res.json({
      id: (req.userId || 1).toString(),
      email: req.userEmail || "trader@tradingjournal.app",
      name: "Trader",
    });
  })
);

export default router;
