'use client'

import Image from "next/image"
import Link from "next/link"
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import fufu from '~/public/112962239_p0.jpg'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function Login() {
  const router = useRouter()

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src={fufu}
          alt="Image"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          style={{
            width: 'auto',
            height: '100%',
          }}
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">登录</h1>
            <p className="text-balance text-muted-foreground">
              输入您的用户名和密码
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div>用户名</div>
              <Input
                id="username"
                type="username"
                placeholder="admin"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <div>密码</div>
                <Link
                  href={"/forgot-password"}
                  className="ml-auto inline-block text-sm underline"
                >
                  忘记密码?
                </Link>
              </div>
              <Input id="password" type="password" required/>
            </div>
            <Button type="submit" className="w-full" onClick={() => toast('还没写！')}>
              登录
            </Button>
            <Button type="submit" className="w-full" onClick={() => router.push('/')}>
              返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}