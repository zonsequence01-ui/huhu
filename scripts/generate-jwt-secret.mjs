/**
 * Generate a random JWT_SECRET for production .env
 * Usage: pnpm generate:jwt-secret
 */
import { randomBytes } from "node:crypto";

const secret = randomBytes(32).toString("base64url");
console.log(secret);
console.error("\nAdd to .env: JWT_SECRET=<value above>");
