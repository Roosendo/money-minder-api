import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { Pool } from "pg";

let authInstance: any = null;

/**
 * Origins allowed to start and complete the OAuth flow.
 *
 * The SPA runs on a different origin than the API, so every origin the app is
 * served from must be listed here. Otherwise Better Auth rejects the callback
 * URL with `INVALID_CALLBACK_URL`.
 */
const trustedOrigins = [
  "http://localhost:4200",
  "http://127.0.0.1:4200",
  "https://money-minder-xi.vercel.app",
  "https://rosendo-garcia.vercel.app",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

export const getBetterAuthInstance = () => {
  if (authInstance) return authInstance;

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });

  const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:7373";
  const isSecure = baseURL.startsWith("https://");

  authInstance = betterAuth({
    baseURL,
    basePath: process.env.BETTER_AUTH_BASE_PATH || "/api/v1/auth",
    secret: process.env.BETTER_AUTH_SECRET || "money-minder-better-auth-secret-key-32chars",
    database: pool,
    trustedOrigins,
    // Better Auth's tables live in the `neon_auth` schema (managed by Neon),
    // while the application tables live in `public`. Kysely understands
    // schema-qualified table names, so the adapter can target them directly.
    user: { modelName: "neon_auth.user" },
    session: { modelName: "neon_auth.session" },
    account: { modelName: "neon_auth.account" },
    verification: { modelName: "neon_auth.verification" },
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
        // The Neon-managed `neon_auth` tables use `uuid` primary keys, while
        // Better Auth defaults to 32-char random strings. Generate UUIDs so
        // inserts satisfy the column type.
        generateId: "uuid",
      },
      useSecureCookies: isSecure,
      // The SPA and the API are cross-site in production, so the session
      // cookie must be sent with SameSite=None; Secure.
      ...(isSecure ? { defaultCookieAttributes: { sameSite: "none" as const, secure: true } } : {}),
    },
    plugins: [bearer()],
  });

  return authInstance;
};
