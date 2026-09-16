import { z } from 'zod'

// the ONLY module allowed to read process.env; everything else imports `env` from here
if (typeof window !== 'undefined') {
  throw new Error(
    'src/config/env.ts is server-only and must never reach the client bundle',
  )
}

// local dev reads .env from disk; hosted platforms inject real env vars instead
try {
  process.loadEnvFile()
} catch {
  // no .env file present, which is expected in CI and on Vercel
}

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message:
        'DATABASE_URL must be a postgres:// or postgresql:// connection string',
    }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export type Env = z.infer<typeof envSchema>

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n')

    throw new Error(`Invalid environment configuration:\n${details}`)
  }

  return result.data
}

// validated once at import time so a bad environment fails at boot, not mid-request
export const env: Readonly<Env> = Object.freeze(parseEnv())

export const isProduction = env.NODE_ENV === 'production'
export const isDevelopment = env.NODE_ENV === 'development'
