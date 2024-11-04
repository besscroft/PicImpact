'use client'

import React, { useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { authenticate } from '~/server/actions'
import { SafeParseReturnType, z } from 'zod'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'

export const UserFrom = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const [email, setEmail] = useState('admin@qq.com')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')

  const { data, isValidating, mutate } = useSWR('/api/open/get-auth-status', fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )
  
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
          <label
            htmlFor="email"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 邮箱 </span>

            <input
              type="email"
              id="email"
              value={email}
              placeholder="admin@qq.com"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="password"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 密码 </span>

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
        </div>
        {
          data?.data?.auth_enable === 'true' &&
          <div className="grid gap-2">
            <div className="flex items-center">
              <div>双因素口令</div>
            </div>
            <div className="mx-auto">
              <InputOTP
                className="object-center"
                maxLength={6}
                value={token}
                onChange={(value: string) => setToken(value)}
                onComplete={(value: string) => setToken(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0}/>
                  <InputOTPSlot index={1}/>
                  <InputOTPSlot index={2}/>
                </InputOTPGroup>
                <InputOTPSeparator/>
                <InputOTPGroup>
                  <InputOTPSlot index={3}/>
                  <InputOTPSlot index={4}/>
                  <InputOTPSlot index={5}/>
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        }
        <Button
          type="submit"
          className="w-full"
          disabled={(data?.data?.auth_enable === 'true' && token.length !== 6) || email.length === 0 || password.length < 6}
          onClick={async () => {
            setIsLoading(true)

            try {
              const parsedCredentials = zHandle()
              if (parsedCredentials.success) {
                const {email, password} = parsedCredentials.data;
                await authenticate(email, password, token)
                toast.success('登录成功！')
                setTimeout(() => {
                  location.replace('/admin')
                }, 1000);
              } else {
                toast.error('请检查您的账号密码！')
              }
            } catch (e) {
              console.log(e)
              toast.error(e?.message)
            } finally {
              setIsLoading(false)
            }
          }}
          aria-label="登录"
        >
          {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          登录
        </Button>
        <Button
          className="w-full"
          onClick={() => router.push('/')}
          aria-label="返回首页"
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}