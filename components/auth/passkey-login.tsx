'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { authClient } from '~/server/auth/auth-client'
import { Fingerprint } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'

interface PasskeyLoginProps {
  className?: string
  email?: string
  onSuccess?: () => void
}

export const PasskeyLogin: React.FC<PasskeyLoginProps> = ({
  className,
  email,
  onSuccess
}) => {
  const router = useRouter()
  const t = useTranslations('Passkey')
  const tLogin = useTranslations('Login')
  const [isLoading, setIsLoading] = useState(false)

  const handlePasskeyLogin = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await authClient.signIn.passkey({
        email: 'user@example.com', // 可选参数，不强制
      })

      if (error) {
        const errorMessage = error.message || '未知错误'
        if (errorMessage.includes('cancelled')) {
          toast.error(t('loginCancelled'))
        } else if (errorMessage.includes('not found') || errorMessage.includes('No credentials')) {
          toast.error(t('loginNotFound'))
        } else if (errorMessage.includes('timeout')) {
          toast.error(t('loginTimeout'))
        } else {
          toast.error(t('loginFailed', { error: errorMessage }))
        }
        return
      }

      if (data) {
        toast.success(t('loginSuccess'))
        onSuccess?.()
        setTimeout(() => {
          router.push('/admin')
        }, 1000)
      }
    } catch (error: any) {
      // 捕获可能的网络或其他错误
      if (error.name === 'NotAllowedError') {
        toast.error(t('loginRejected'))
      } else if (error.name === 'InvalidStateError') {
        toast.error(t('loginInUse'))
      } else if (error.name === 'NotSupportedError') {
        toast.error(t('loginNotSupported'))
      } else {
        toast.error(t('loginError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePasskeyLogin}
      disabled={isLoading}
      className={className}
      variant="outline"
      title={!email ? t('enterEmailFirst') : ''}
    >
      {isLoading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-4 w-4" />
      )}
      {tLogin('passkeyLogin')}
    </Button>
  )
}