'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next-nprogress-bar'
import { toast } from 'sonner'
import { SafeParseReturnType, z } from 'zod'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'

export const SignUpForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'form'>) => {
  const router = useRouter()
  const t = useTranslations()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const emailRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
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
      handleSignUp()
    }
  }

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
        toast.error(t('Login.invalidCredentials', { defaultValue: 'Please check your email and password format' }))
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
          toast.success(t('Login.signUpSuccess', { defaultValue: 'Sign up successful' }))
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
      toast.error(t('Login.error', { defaultValue: 'An error occurred, please try again' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleSignUp()
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} {...props}>
      <div className="space-y-2">
        <Label htmlFor="email" className="select-none">{t('Login.email')}</Label>
        <Input
          id="email"
          type="email"
          className="h-12"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          ref={emailRef}
          onKeyDown={emailKeyPressHandler}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="select-none">{t('Login.password')}</Label>
        <Input
          id="password"
          type="password"
          className="h-12"
          required
          value={password}
          ref={passwordRef}
          onKeyDown={passwordKeyPressHandler}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="w-full h-12 select-none cursor-pointer"
        disabled={email.length === 0 || password.length < 8}
        aria-label={t('Login.signUp')}
      >
        {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}{t('Login.signUp')}
      </Button>
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
