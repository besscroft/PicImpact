'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { ReloadIcon } from '@radix-ui/react-icons'
import { authClient } from '~/server/auth/auth-client'
import { Fingerprint } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '~/lib/utils'

interface PasskeyRegisterProps {
  email?: string
  onSuccess?: () => void
  className?: string
}

export const PasskeyRegister: React.FC<PasskeyRegisterProps> = ({
  email,
  onSuccess,
  className
}) => {
  const t = useTranslations('Passkey')
  const [isLoading, setIsLoading] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')

  const handleRegisterPasskey = async () => {
    if (!email) {
      toast.error(t('loginRequiredForRegister'))
      return
    }

    const name = passkeyName.trim() || email || `PicImpact-${new Date().toLocaleDateString()}`

    setIsLoading(true)
    try {
      const result = await authClient.passkey.addPasskey({
        name: name
      })

      if (result?.error) {
        toast.error(t('registerFailed', { error: result.error.message }))
        return
      }

      toast.success(t('registerSuccess'))
      setPasskeyName('') // 清空输入框
      onSuccess?.()
    } catch (error) {
      console.error('Passkey registration error:', error)
      toast.error(t('registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn(
      'space-y-3 max-w-sm items-center',
      className
    )}>
    <div>
      <Label htmlFor="passkey-name" className="text-sm font-medium">
        {t('nameLabel')}
      </Label>
      <Input
        id="passkey-name"
        type="text"
        placeholder={t('namePlaceholder', { email: email || t('notLoggedIn') })}
        value={passkeyName}
        onChange={(e) => setPasskeyName(e.target.value)}
        disabled={isLoading || !email}
        className="mt-1"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {t('nameHint')}
      </p>
    </div>
    <Button
      onClick={handleRegisterPasskey}
      disabled={isLoading || !email}
      className="w-full"
      variant="outline"
    >
      {isLoading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-4 w-4" />
      )}
      {t('register')}
    </Button>
  </div>
  )
}