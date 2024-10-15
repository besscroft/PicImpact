import 'server-only'
import { queryAuthTemplateSecret } from '~/server/db/query'
import * as OTPAuth from 'otpauth'
import { deleteAuthSecret, saveAuthSecret, saveAuthTemplateSecret } from '~/server/db/operate'
import { Hono } from 'hono'

const app = new Hono()

app.get('/get-seed-secret', async (c) => {
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

    return c.json({
      code: 200,
      message: '令牌颁发成功！',
      data: {
        uri: totp.toString(),
        secret: secret.base32
      }
    })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '令牌颁发失败！' })
  }
})

app.post('/validate', async (c) => {
  const data = await c.req.json()
  try {
    const secret = await queryAuthTemplateSecret();
    let totp = new OTPAuth.TOTP({
      issuer: "PicImpact",
      label: "admin",
      algorithm: "SHA512",
      digits: 6,
      period: 30,
      // @ts-ignore
      secret: OTPAuth.Secret.fromBase32(secret?.config_value),
    });
    let delta = totp.validate({ token: data.token, window: 1 })
    if (delta === 0) {
      // @ts-ignore
      await saveAuthSecret('true', secret?.config_value)
      return c.json({ code: 200, message: '设置成功！' })
    }
    return c.json({ code: 500, message: '设置失败！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '设置失败！' })
  }
})

app.delete('/remove', async (c) => {
  try {
    await deleteAuthSecret();
    return c.json({ code: 200, message: '移除成功！' })
  } catch (e) {
    console.log(e)
    return c.json({ code: 500, message: '移除失败！' })
  }
})

export default app