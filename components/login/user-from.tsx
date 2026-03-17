'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { z } from 'zod'
import type { SafeParseReturnType } from 'zod'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'
import { PasskeyLogin } from '~/components/auth/passkey-login'
import { checkUserExists } from '~/server/db/query/users'

export const UserFrom = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) => {
  const router = useRouter()
  const t = useTranslations()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string>('')
  const [otp, setOtp] = useState(false)
  const [userExists, setUserExists] = useState<boolean>(true)

  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
    checkUserExists().then(exists => setUserExists(exists))
  }, [])

  const emailKeyPressHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordRef.current?.focus()
    }
  }

  const passwordKeyPressHandler = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordRef.current?.blur()
      if (otp) {
        await verifyTotp()
      } else {
        await handleLogin()
      }
    }
  }

  function zHandle(): SafeParseReturnType<string | any, string | any> {
    const parsedCredentials = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse({ email, password })

    return parsedCredentials
  }

  const verifyTotp = async () => {
    const { error } = await authClient.twoFactor.verifyTotp({ code: token })

    if (error) {
      toast.error(t('Login.twoFactorFailed', { defaultValue: 'Two-factor verification failed' }))
      return
    }

    toast.success(t('Login.success', { defaultValue: 'Login successful' }))
    setTimeout(() => {
      location.replace('/admin')
    }, 1000)
  }

  const handleLogin = async () => {
    setIsLoading(true)

    try {
      const parsedCredentials = zHandle()
      if (!parsedCredentials.success) {
        toast.error(t('Login.invalidCredentials', { defaultValue: 'Please check your email and password format' }))
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
        toast.error(t('Login.wrongCredentials', { defaultValue: 'Incorrect email or password' }))
        return
      }
    } catch (e) {
      console.error(e)
      toast.error(t('Login.error', { defaultValue: 'An error occurred, please try again' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (otp) {
      await verifyTotp()
    } else {
      await handleLogin()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} {...props}>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="email" className="select-none">{t('Login.email')}</Label>
          {
            !userExists &&
            <div
              onClick={() => router.push('/sign-up')}
              className="ml-auto text-sm underline-offset-4 hover:underline select-none cursor-pointer"
            >
              {t('Login.signUp')}
            </div>
          }
        </div>
        <Input
          id="email"
          type="email"
          className="h-12"
          ref={emailRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={emailKeyPressHandler}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center">
          <Label htmlFor="password" className="select-none">{t('Login.password')}</Label>
        </div>
        <Input
          id="password"
          type="password"
          className="h-12"
          ref={passwordRef}
          required
          value={password}
          onKeyDown={passwordKeyPressHandler}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {
        otp &&
          <div className="space-y-2">
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
        className="w-full h-12 select-none cursor-pointer"
        disabled={email.length === 0 || password.length < 8}
        aria-label={t('Login.signIn')}
      >
        {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}{t('Login.signIn')}
      </Button>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground select-none">
            {t('Login.or')}
          </span>
        </div>
      </div>
      <PasskeyLogin className="w-full h-12" email={email} />
      <Button
        variant="ghost"
        className="w-full select-none cursor-pointer"
        onClick={() => router.push('/')}
        aria-label={t('Login.goHome')}
      >
        {t('Login.goHome')}
      </Button>
    </form>
  )
}
