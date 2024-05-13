import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '~/server/lib/db'
import { z } from 'zod'
import CryptoJS from 'crypto-js'
import { fetchSecretKey } from '~/server/lib/query'

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || 'pic-impact',
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "Credentials",
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email", placeholder: "example@qq.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;

          const user = await db.user.findFirst({
            where: {
              email: email,
            },
          })

          const secretKey = await fetchSecretKey()

          if (secretKey && secretKey.config_value) {
            const hashedPassword = CryptoJS.HmacSHA512(password, secretKey?.config_value).toString()

            if (user && hashedPassword === user.password) {
              return user;
            }
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }
      return token
    },
    async session({ token, session }) {
      if (token) {
        // @ts-ignore
        session.user.id = token.id
        // @ts-ignore
        session.user.name = token.name
        // @ts-ignore
        session.user.email = token.email
        // @ts-ignore
        session.user.image = token.image
      }

      return session
    },
  }
})