import { PrismaClient } from "@prisma/client";

// bigint ids (matching hkfin's users.id and this schema's own identity
// columns) don't serialize with JSON.stringify by default — express's
// res.json() would throw. Ids stay well under Number.MAX_SAFE_INTEGER, and
// serializing to string keeps the wire format identical to the old cuid
// strings so the frontend needs no changes.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const prisma = new PrismaClient();
