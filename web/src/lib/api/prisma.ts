import { Prisma } from "@prisma/client";

/** Prisma "record to update not found". */
export function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
