'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { authClient } from '~/server/auth/auth-client.ts'

export default function Preferences() {
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { data: session, isPending } = authClient.useSession()
  
  async function updateUserInfo() {
    try {
      setLoading(true)
      const { error } = await authClient.updateUser({
        image: avatar,
      })
      if (error) {
        toast.error('修改失败！')
      } else {
        toast.success('修改成功！')
      }
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    setAvatar(session?.user?.image?.toString() || '')
  },[session])

  return (
    <div className="flex flex-col space-y-4 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div>{t('Link.account')}</div>
        <Button
          variant="outline"
          disabled={loading || isPending}
          onClick={() => updateUserInfo()}
          aria-label={t('Button.submit')}
          className="cursor-pointer"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Button.submit')}
        </Button>
      </div>
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="avatar">{t('Account.avatar')}</Label>
          <Textarea
            id="avatar"
            disabled={isPending}
            value={avatar || ''}
            placeholder={t('Account.inputAvatar')}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
