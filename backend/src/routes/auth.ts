import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

function issueToken(user: { email: string; id: bigint; role: string | null }) {
  return jwt.sign(
    { sub: user.email, id: Number(user.id), role: user.role || "user" },
    process.env.JWT_SECRET_KEY as string,
    { expiresIn: "7d" }
  );
}

function serializeUser(user: { id: bigint; email: string; name: string; picture: string | null }) {
  return { id: user.id.toString(), email: user.email, name: user.name, picture: user.picture ?? undefined };
}

// Google sign-in/sign-up — mirrors hkfin's POST /api/auth/google exactly
// (same JWT secret + payload shape, same shared `users` table matched by
// email), so an account created here also works on hkfin and vice versa.
router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { email, name, picture } = req.body as { email?: string; name?: string; picture?: string };
    if (!email || !name) {
      return res.status(400).json({ error: "Thiếu email hoặc tên từ Google" });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, picture, provider: "google" },
      create: { email, name, picture, provider: "google" },
    });

    res.json({ token: issueToken(user), user: serializeUser(user) });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json(serializeUser(user));
  })
);

export default router;
