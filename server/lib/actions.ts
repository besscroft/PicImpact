'use server'

import { signIn } from '~/server/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
  email: string, password: string
) {
  try {
    await signIn('Credentials', {
      email: email,
      password: password,
      redirect: true,
      redirectTo: '/admin'
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}