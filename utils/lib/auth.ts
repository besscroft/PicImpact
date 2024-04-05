import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import PostgresAdapter from '@auth/pg-adapter'
import pool from '~/utils/lib/db'
import { z } from 'zod'
// import { toast } from 'sonner'

const authConfig = {
  secret: 'T7tQXKqqKjZrJhN62Z05AHY8qKGQKaG/4iqv0tKmEvw=',
  adapter: PostgresAdapter(pool),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          // TODO 邮件和密码校验
          console.log(email, password)

          const user = await pool.query('SELECT * FROM users WHERE email = $1::text LIMIT 1', [`${email}`])

          console.log(user.rowCount)
          console.log(user.rows[0])
          if (user.rowCount === 0) {
            // toast.error('登录失败！', {duration: 1000})
            return null;
          }

          // toast.success('登录成功！', {duration: 1000})
          return user.rows[0];
        }

        console.log('Invalid credentials');
        // toast.error('登录失败！', {duration: 1000})
        return null;
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user = {
          ...session.user,
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = await pool.query('SELECT * FROM users WHERE email = $1::text LIMIT 1', [`${user.email}`])

      if (dbUser.rowCount === 0) {
        token.id = Number(user?.id)
        return token
      }

      return {
        ...token,
        id: dbUser.rows[0]?.id,
        name: dbUser.rows[0]?.name,
        email: dbUser.rows[0]?.email,
        picture: dbUser.rows[0]?.image,
      }
    },
  },
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
} = NextAuth(authConfig)