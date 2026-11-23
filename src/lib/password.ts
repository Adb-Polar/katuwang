import bcrypt from "bcryptjs";
import { runQueued } from "@/lib/requestQueue";

const BCRYPT_COST = 12;

/**
 * bcryptjs runs on the main thread, so every hash/compare goes through the
 * `password` lane: a burst of sign-ins waits its turn instead of freezing the
 * event loop for everyone. Throws `QueueOverloadedError` when the lane is full.
 */
export function hashPassword(password: string): Promise<string> {
  return runQueued("password", () => bcrypt.hash(password, BCRYPT_COST));
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return runQueued("password", () => bcrypt.compare(password, hash));
}
