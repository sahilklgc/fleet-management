export interface AppEnv {
  DATABASE_URL: string;
  REDIS_URL: string;
  NEXT_PUBLIC_API_BASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

export const requiredEnv = [
  "DATABASE_URL",
  "REDIS_URL",
  "NEXT_PUBLIC_API_BASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET"
] as const;
