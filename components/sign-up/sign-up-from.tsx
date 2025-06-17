'use client'

import React, { useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { SafeParseReturnType, z } from 'zod'
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
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'

export const SignUpForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) => {
  const router = useRouter()
  const t = useTranslations()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email, password })

    return parsedCredentials
  }

  const handleSignUp = async () => {
    setIsLoading(true)

    try {
      const parsedCredentials = zHandle()
      if (!parsedCredentials.success) {
        toast.error('请检查您的账号密码格式！')
        return
      }

      const { email, password } = parsedCredentials.data

      await authClient.signUp.email({
        email, // user email address
        password, // user password -> min 8 characters by default
        name: 'admin', // user display name
        image: '', // User image URL (optional)
      }, {
        onRequest: (ctx) => {
          //show loading
          console.log(ctx)
        },
        onSuccess: (ctx) => {
          toast.success('注册成功！')
          setTimeout(() => {
            location.replace('/admin')
          }, 1000)
        },
        onError: (ctx) => {
          toast.error(ctx.error.message)
        },
      })

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
          <CardTitle className="text-xl select-none">{t('Login.signUp')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="select-none">{t('Login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="select-none">{t('Login.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                className="w-full select-none cursor-pointer"
                onClick={async () => await handleSignUp()}
                disabled={email.length === 0 || password.length < 8}
                aria-label={t('Login.signUp')}
              >
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}{t('Login.signUp')}
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
    </div>
  )
}