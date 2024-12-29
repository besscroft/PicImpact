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
import { cn } from '~/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useButtonStore } from '~/app/providers/button-store-Providers.tsx'
import LoginHelpSheet from '~/components/login/LoginHelpSheet.tsx'

export const UserFrom = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')

  const { setLoginHelp } = useButtonStore(
    (state) => state,
  )

  const { data } = useSWR('/api/open/get-auth-status', fetcher,
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl select-none">欢迎登录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="select-none">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="admin@qq.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="select-none">密码</Label>
                  <div
                    onClick={() => setLoginHelp(true)}
                    className="ml-auto text-sm underline-offset-4 hover:underline select-none cursor-pointer"
                  >
                    忘记密码了吗?
                  </div>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {
                data?.data?.auth_enable === 'true' &&
                  <div className="grid gap-2">
                    <div className="flex items-center select-none">
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
                className="w-full select-none"
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
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>} 登录
              </Button>
              <Button
                className="w-full select-none"
                onClick={() => router.push('/')}
                aria-label="返回首页"
              >
                返回首页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <LoginHelpSheet />
    </div>
  )
}