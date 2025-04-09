'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'

export default function Preferences() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { data, isValidating, isLoading } = useSWR<{name: string,email: string, image:string,id:string}>('/api/v1/settings/get-user-info', fetcher)
  const { update } = useSession()
  async function updateUserInfo() {
    try {
      setLoading(true)
      await fetch('/api/v1/settings/update-user-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          avatar: avatar,
        }),
      }).then(res => res.json())
      toast.success('修改成功！')
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setLoading(false)
    }
    await update({
      user: {
        ...data,
        name: name,
        email: email,
        image: avatar
      }
    });
  }
  useEffect(()=>{
    setEmail(data?.email?.toString() || '');
    setName(data?.name?.toString() || '');
    setAvatar(data?.image?.toString() || '');
  },[data])
  return (
    <div className="flex flex-col space-y-4 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div>{t("Link.account")}</div>
        <Button
          variant="outline"
          disabled={loading || isValidating}
          onClick={() => updateUserInfo()}
          aria-label={t("Button.submit")}
          className="cursor-pointer"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t("Button.submit")}
        </Button>
      </div>
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="email">{t('Account.email')}</Label>
          <Input
            type="email"
            id="email"
            disabled={isValidating || isLoading}
            value={email || ''}
            placeholder={t('Account.inputEmail')}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="name">{t('Account.username')}</Label>
          <Input
            type="text"
            id="name"
            disabled={isValidating || isLoading}
            value={name || ''}
            placeholder={t('Account.inputUsername')}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="avatar">{t('Account.avatar')}</Label>
          <Textarea
            id="avatar"
            disabled={isValidating || isLoading}
            value={avatar || ''}
            placeholder={t('Account.inputAvatar')}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
