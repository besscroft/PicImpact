import { PrismaClient } from '~/prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  })
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prisma || prismaClientSingleton()

export const db = prisma

globalThis.prisma = prisma
