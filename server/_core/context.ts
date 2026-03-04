import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const ownerId = process.env.OWNER_OPEN_ID || "default-user";
  await db.upsertUser({
    openId: ownerId,
    name: process.env.OWNER_NAME || "Owner",
    email: process.env.OWNER_EMAIL || null,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });
  const user = (await db.getUserByOpenId(ownerId)) ?? null;
  return { req: opts.req, res: opts.res, user };
}
