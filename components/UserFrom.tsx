'use client'

import { useState } from 'react'
import { Input } from '@nextui-org/input'
import Link from 'next/link'
import { Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { authenticate } from '~/app/actions'
// import { useFormState, useFormStatus } from 'react-dom'

export const UserFrom = () => {
  const router = useRouter()

  // const [errorMessage, dispatch] = useFormState(authenticate, undefined)
  // const { pending } = useFormStatus()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form className="mx-auto grid w-[350px] gap-6">
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
          isLoading={isLoading}
          onClick={async () => {
            setIsLoading(true)
            await authenticate(email, password)
            setIsLoading(false)
          }}
        >
          登录
        </Button>
        <Button type="submit" className="w-full" onClick={() => router.push('/')}>
          返回首页
        </Button>
      </div>
    </form>
  )
}