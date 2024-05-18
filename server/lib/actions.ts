'use server'

import { signIn, signOut } from '~/server/auth'

export async function authenticate(
  email: string, password: string
) {
  try {
    await signIn('Credentials', {
      email: email,
      password: password,
      redirect: false,
    });
  } catch (error) {
    throw error;
  }
}

export async function loginOut() {
  try {
    await signOut({
      redirect: false,
    });
  } catch (error) {
    throw error;
  }
}