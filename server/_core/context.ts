import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // ---- LOCAL DEV BYPASS ----
  if (process.env.NODE_ENV === "development") {
    await db.upsertUser({
      openId: "local-dev-user",
      name: "Dev User",
      email: "dev@local.com",
      loginMethod: "local",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId("local-dev-user");
    return { req: opts.req, res: opts.res, user };
  }
  // ---- END BYPASS ----

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}