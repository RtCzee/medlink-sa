import { PrismaClient } from '@prisma/client'

// SECURITY: this client connects with DATABASE_URL as a privileged database role and
// BYPASSES Row Level Security. Every query must be scoped to the verified user in
// code (see src/app/api/*). Never use it to decide who the user is.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Warnings and errors only. Query logging would write SQL for every request to
    // the server logs, so it stays off.
    log: ['warn', 'error'],
    errorFormat: 'minimal',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
