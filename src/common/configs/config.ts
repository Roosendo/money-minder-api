import type { Config } from "./config.interface";

const defaultOrigins = [
  "http://localhost:4321",
  "http://localhost:4200",
  "http://localhost:3000",
  "https://money-minder-xi.vercel.app",
  "https://rosendo-garcia.vercel.app",
];

const originsFromEnv = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : [];

const config: Config = {
  nest: {
    port: +(process.env.PORT || "7373"),
  },
  cors: {
    origins: Array.from(new Set([...defaultOrigins, ...originsFromEnv])),
  },
  betterAuth: {
    url: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
};

export default (): Config => config;
