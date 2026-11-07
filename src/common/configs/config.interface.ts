export interface NestConfig {
  port: number;
}

export interface CorsConfig {
  enabled: boolean;
}

export interface Config {
  nest: NestConfig;
  cors: CorsConfig;
}
