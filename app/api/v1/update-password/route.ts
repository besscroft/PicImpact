import 'server-only'
import { updatePassword } from '~/server/lib/operate'
import { NextRequest } from 'next/server'
import { auth } from '~/server/auth'
import CryptoJS from 'crypto-js'
import { fetchUserById } from '~/server/lib/query'

export async function PUT(req: NextRequest) {
  const { user } = await auth()
  const pwd = await req.json()
  const daUser = await fetchUserById(user?.id)
  const hashedOldPassword = CryptoJS.HmacSHA512(pwd.oldPassword, process.env.SECRET_KEY || '').toString()

  try {
    if (daUser && hashedOldPassword === daUser.password) {
      const hashedNewPassword = CryptoJS.HmacSHA512(pwd.newPassword, process.env.SECRET_KEY || '').toString()
      const data = await updatePassword(user?.id, hashedNewPassword);
      return Response.json({
        code: 200,
        message: '更新成功！'
      })
    } else {
      return Response.json({
        code: 500,
        message: '旧密码不匹配！'
      })
    }
  } catch (e) {
    return Response.json({
      code: 500,
      message: '更新失败！'
    })
  }
}