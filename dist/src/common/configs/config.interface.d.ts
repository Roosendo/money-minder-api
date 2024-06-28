export interface NestConfig {
    port: number;
}
export interface CorsConfig {
    enabled: boolean;
    allowedOrigins: string[];
}
export interface SwaggerConfig {
    enabled: boolean;
    title: string;
    description: string;
    version: string;
    path: string;
}
export interface Config {
    nest: NestConfig;
    cors: CorsConfig;
    swagger: SwaggerConfig;
}
