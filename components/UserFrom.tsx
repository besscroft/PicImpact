'use client'

import { useState } from 'react'
import { Input } from '@nextui-org/input'
import Link from 'next/link'
import { Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authenticate } from '~/server/lib/actions'
import { SafeParseReturnType, z } from 'zod'

export const UserFrom = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('admin@qq.com')
  const [password, setPassword] = useState('666666')
  
  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .safeParse({ email, password });

    return parsedCredentials;
  }

  return (
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">登录</h1>
        <p className="text-balance text-muted-foreground">
          输入您的邮箱和密码
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div>邮箱</div>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="admin@qq.com"
            value={email}
            onValueChange={(value) => setEmail(value)}
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
          <Input
            id="password"
            type="password"
            name="password"
            value={password}
            onValueChange={(value) => setPassword(value)}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          color="primary"
          variant="shadow"
          isLoading={isLoading}
          onClick={async () => {
            setIsLoading(true)

            try {
              const parsedCredentials = zHandle()
              if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                await authenticate(email, password)
                toast.success('登录成功！')
              } else {
                toast.error('请检查您的账号密码！')
              }
            } catch (e) {
              toast.error('登录失败！')
            }
            setIsLoading(false)
          }}
        >
          登录
        </Button>
        <Button
          type="submit"
          className="w-full"
          variant="shadow"
          onClick={() => router.push('/')}
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}