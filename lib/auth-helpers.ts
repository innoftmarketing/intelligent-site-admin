// PIN hashing helper. Mirrors intelligent-site-backend/src/services/auth.ts.
import bcrypt from "bcrypt";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}
