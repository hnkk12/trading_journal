import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  userId?: bigint;
  userEmail?: string;
  userRole?: string;
}

interface HkfinJwtPayload {
  sub: string; // email
  id: number; // hkfin users.id
  role?: string;
  exp: number;
}

// Trading Journal signs in via its own Google flow (routes/auth.ts) using
// the same JWT_SECRET_KEY and payload shape { sub: email, id, role, exp }
// that hkfin's login issues (see agent/api_server.py: generate_jwt_token) —
// so a token from either app is valid here, and the id links straight to
// the row in the shared `users` table, no separate account/link table needed.
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as HkfinJwtPayload;
      if (payload && payload.id != null) {
        req.userId = BigInt(payload.id);
        req.userEmail = payload.sub;
        req.userRole = payload.role;
        return next();
      }
    } catch {
      // Invalid/expired token falls through to 401 below
    }
  }

  res.status(401).json({ error: "Chưa đăng nhập hoặc phiên đã hết hạn" });
}
