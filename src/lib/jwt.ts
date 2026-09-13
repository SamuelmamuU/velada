import jwt from "jsonwebtoken";
import { JWTPayload } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "velada_default_jwt_secret_dev_key";

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "3650d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
