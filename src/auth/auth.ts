import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { Pool } from "pg";

let authInstance: any = null;

export const getBetterAuthInstance = () => {
  if (authInstance) return authInstance;

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });

  authInstance = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:7373",
    secret: process.env.BETTER_AUTH_SECRET || "money-minder-better-auth-secret-key-32chars",
    database: pool,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_id",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_secret",
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "placeholder_github_id",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder_github_secret",
      },
    },
    advanced: {
      database: {
        validateSchema: false,
      },
    },
    plugins: [bearer()],
  });

  return authInstance;
};
