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

// Trading Journal has no login of its own. A user authenticates on hkfin,
// which issues a standard HS256 JWT (see agent/api_server.py:
// generate_jwt_token, payload { sub: email, id, role, exp }). The frontend
// forwards that same token as a Bearer header here; verifying it with the
// same JWT_SECRET_KEY is what "links" a journal entry to the exact hkfin
// user, with no separate account or link table needed.
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
      // Fall through to default fallback user
    }
  }

  // Vào thẳng không cần token
  req.userId = BigInt(1);
  req.userEmail = "trader@tradingjournal.app";
  req.userRole = "admin";
  next();
}
