'use server'

import { AuthError } from 'next-auth'
import { signIn } from '~/utils/lib/auth'

export async function authenticate(
  email:string, password: string
) {
  try {
    await signIn('credentials', {
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