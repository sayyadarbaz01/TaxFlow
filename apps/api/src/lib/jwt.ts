import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config";
import { AuthUser } from "@ca-saas/shared-types";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: "30d"
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      const decoded = jwt.decode(token) as AccessTokenPayload | null;
      if (decoded && (decoded.userId || decoded.email)) {
        return decoded;
      }
    }
    throw err;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
