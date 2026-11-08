export interface NestConfig {
  port: number;
}

export interface CorsConfig {
  origins: string[];
}

export interface BetterAuthConfig {
  url?: string;
  secret?: string;
}

export interface OAuthConfig {
  clientId?: string;
  clientSecret?: string;
}

export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
  betterAuth: BetterAuthConfig;
  google: OAuthConfig;
  github: OAuthConfig;
}
