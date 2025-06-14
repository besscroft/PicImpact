'use server'

import { queryAuthSecret, queryAuthStatus } from '~/server/db/query/configs'
import * as OTPAuth from 'otpauth'

export async function validate2FA(token: string) {
  try {
    const enable = await queryAuthStatus()
    if (enable?.config_value === 'true') {
      const secret = await queryAuthSecret()
      const totp = new OTPAuth.TOTP({
        issuer: 'PicImpact',
        label: 'admin',
        algorithm: 'SHA512',
        digits: 6,
        period: 30,
        // @ts-ignore
        secret: OTPAuth.Secret.fromBase32(secret?.config_value),
      })
      const delta = totp.validate({ token: token, window: 1 })
      if (delta === 0) {
        return true
      }
      return false
    }
    return true // 如果2FA未启用，直接返回true
  } catch (error) {
    throw error
  }
}
