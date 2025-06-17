'use client'

import React, { useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { SafeParseReturnType, z } from 'zod'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
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
import { useButtonStore } from '~/app/providers/button-store-providers'
import LoginHelpSheet from '~/components/login/login-help-sheet'
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'

export const UserFrom = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) => {
  const router = useRouter()
  const t = useTranslations()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string>('')
  const [otp, setOtp] = useState(false)

  const { setLoginHelp } = useButtonStore(
    (state) => state,
  )
  
  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email, password })

    return parsedCredentials
  }

  const verifyTotp = async () => {
    const { error } = await authClient.twoFactor.verifyTotp({ code: token })

    if (error) {
      toast.error('双因素口令验证失败！')
      return
    }

    toast.success('登录成功！')
    setTimeout(() => {
      location.replace('/admin')
    }, 1000)
  }

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      const parsedCredentials = zHandle()
      if (!parsedCredentials.success) {
        toast.error('请检查您的账号密码格式！')
        return
      }

      const { email, password } = parsedCredentials.data

      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/',
      }, {
        onSuccess(ctx) {
          if (ctx.data.twoFactorRedirect) {
            setOtp(true)
          }
        }
      })

      if (error) {
        toast.error('账号或密码错误！')
        return
      }
    } catch (e) {
      console.error(e)
      toast.error('登录过程中出现错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl select-none">{t('Login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="email" className="select-none">{t('Login.email')}</Label>
                  <div
                    onClick={() => router.push('/sign-up')}
                    className="ml-auto text-sm underline-offset-4 hover:underline select-none cursor-pointer"
                  >
                    {t('Login.signUp')}
                  </div>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="select-none">{t('Login.password')}</Label>
                  <div
                    onClick={() => setLoginHelp(true)}
                    className="ml-auto text-sm underline-offset-4 hover:underline select-none cursor-pointer"
                  >
                    {t('Login.forget')}
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
                otp &&
                  <div className="grid gap-2">
                    <div className="flex items-center select-none">
                      <div>{t('Login.otp')}</div>
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
                className="w-full select-none cursor-pointer"
                disabled={email.length === 0 || password.length < 8}
                onClick={async () => {
                  if (otp) {
                    await verifyTotp()
                  } else {
                    await handleLogin()
                  }
                }}
                aria-label={t('Login.signIn')}
              >
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}{t('Login.signIn')}
              </Button>
              <Button
                className="w-full select-none cursor-pointer"
                onClick={() => router.push('/')}
                aria-label={t('Login.goHome')}
              >
                {t('Login.goHome')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <LoginHelpSheet />
    </div>
  )
}