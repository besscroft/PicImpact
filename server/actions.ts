'use server'

import { signIn, signOut } from '~/server/auth'
import { queryAuthSecret, queryAuthStatus } from '~/server/db/query'
import * as OTPAuth from 'otpauth'

export async function authenticate(
  email: string, password: string, token: string
) {
  try {
    const enable = await queryAuthStatus();
    if (enable?.config_value === 'true') {
      const secret = await queryAuthSecret();
      let totp = new OTPAuth.TOTP({
        issuer: "PicImpact",
        label: "admin",
        algorithm: "SHA512",
        digits: 6,
        period: 30,
        // @ts-ignore
        secret: OTPAuth.Secret.fromBase32(secret?.config_value),
      });
      let delta = totp.validate({ token: token, window: 1 })
      if (delta === 0) {
        try {
          await signIn('Credentials', {
            email: email,
            password: password,
            redirect: false,
          });
        } catch (e) {
          throw new Error('登录失败！')
        }
      } else {
        throw new Error('双因素口令验证失败！')
      }
    } else {
      try {
        await signIn('Credentials', {
          email: email,
          password: password,
          redirect: false,
        });
      } catch (e) {
        throw new Error('登录失败！')
      }
    }
  } catch (error) {
    throw error
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