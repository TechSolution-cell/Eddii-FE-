import { z } from 'zod';

const envSchema = z.object({
    NEXT_PUBLIC_BACKEND_API_BASE: z.string().url(),
});

const env = envSchema.parse({
    NEXT_PUBLIC_BACKEND_API_BASE: process.env.NEXT_PUBLIC_BACKEND_API_BASE,
});

export const API_BASE = env.NEXT_PUBLIC_BACKEND_API_BASE;
