'use client'

import React, { useState } from 'react'
import { Button, Input } from '@nextui-org/react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { authenticate } from '~/server/lib/actions'
import { SafeParseReturnType, z } from 'zod'
import confetti from 'canvas-confetti'
import { Eye, EyeOff } from 'lucide-react'

export const UserFrom = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const [email, setEmail] = useState('admin@qq.com')
  const [password, setPassword] = useState('')
  
  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(6) })
      .safeParse({ email, password });

    return parsedCredentials;
  }

  const handleConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 360,
      startVelocity: 30,
      ticks: 60,
      origin: { x: Math.random() - 0.1, y: Math.random() - 0.2 }
    });
  };

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
          </div>
          <Input
            id="password"
            name="password"
            value={password}
            onValueChange={(value) => setPassword(value)}
            required
            endContent={
              <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
                {isVisible ? (
                  <Eye className="text-2xl text-default-400 pointer-events-none" />
                ) : (
                  <EyeOff className="text-2xl text-default-400 pointer-events-none" />
                )}
              </button>
            }
            type={isVisible ? 'text' : 'password'}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          color="primary"
          variant="shadow"
          isLoading={isLoading}
          onPress={handleConfetti}
          onClick={async () => {
            setIsLoading(true)

            try {
              const parsedCredentials = zHandle()
              if (parsedCredentials.success) {
                const { email, password } = parsedCredentials.data;
                await authenticate(email, password)
                toast.success('登录成功！')
                setTimeout(() => {
                  location.replace('/admin')
                }, 1000);
              } else {
                toast.error('请检查您的账号密码！')
              }
            } catch (e) {
              toast.error('登录失败！')
            } finally {
              setIsLoading(false)
            }
          }}
          aria-label="登录"
        >
          登录
        </Button>
        <Button
          type="submit"
          className="w-full"
          variant="shadow"
          onClick={() => router.push('/')}
          aria-label="返回首页"
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}