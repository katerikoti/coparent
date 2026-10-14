import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema";
import { getDb } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[auth] Password reset for ${user.email}: ${url}`);
    },
  },
  user: {
    additionalFields: {
      locale: { type: "string", defaultValue: "fi", input: true },
    },
  },
});
