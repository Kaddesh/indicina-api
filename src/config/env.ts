import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  baseUrl: string;
  corsOrigin: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${Number(process.env.PORT) || 3000}`,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

