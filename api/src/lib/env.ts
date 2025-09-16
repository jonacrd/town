import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Schema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ALLOW_ORIGIN: z.string().default('http://localhost:4321'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // WhatsApp Configuration
  WHATSAPP_PROVIDER: z.enum(['twilio', 'meta']).default('twilio'),
  
  // Twilio Configuration (optional based on provider)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  
  // Meta Configuration (optional based on provider)
  META_VERIFY_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  
  // App Configuration
  APP_BASE_URL: z.string().default('https://town.tld'),
});

// Validar y exportar configuración
export const env = envSchema.parse(process.env);

// Tipos
export type Env = z.infer<typeof envSchema>;
