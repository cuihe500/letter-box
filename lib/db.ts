import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function ensureDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const loadEnvFile = (process as unknown as { loadEnvFile?: (path?: string) => void }).loadEnvFile
  if (typeof loadEnvFile === 'function') {
    for (const envPath of ['.env.local', '.env']) {
      try {
        loadEnvFile(envPath)
      } catch {
        // ignore missing env files
      }
      if (process.env.DATABASE_URL) break
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL 未设置：请在 `.env.local` 或 `.env` 中配置 DATABASE_URL，或在运行前导出该环境变量。'
    )
  }

  return process.env.DATABASE_URL
}

// 创建适配器（直接使用 DATABASE_URL）
const adapter = new PrismaMariaDb(ensureDatabaseUrl())

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
