import 'server-only'
import * as OTPAuth from 'otpauth'
import { saveAuthTemplateSecret } from '~/server/lib/operate'

export async function GET() {
  try {
    let secret = new OTPAuth.Secret({ size: 12 });

    let totp = new OTPAuth.TOTP({
      issuer: "PicImpact",
      label: "admin",
      algorithm: "SHA512",
      digits: 6,
      period: 30,
      secret: secret,
    });

    await saveAuthTemplateSecret(secret.base32);

    return Response.json({
      code: 200,
      message: '令牌颁发成功！',
      data: {
        uri: totp.toString(),
        secret: secret.base32
      }
    })
  } catch (e) {
    console.log(e)
    return Response.json({ code: 500, message: '令牌颁发失败！' })
  }
}

export const dynamic = 'force-dynamic'