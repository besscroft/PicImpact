'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

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
    <div className="space-y-2">
      <label
        htmlFor="email"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Account.email')}</span>

        <input
          type="email"
          id="email"
          disabled={isValidating || isLoading}
          value={email || ''}
          placeholder={t('Account.inputEmail')}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="name"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t("Account.username")} </span>

        <input
          type="text"
          id="name"
          disabled={isValidating || isLoading}
          value={name || ''}
          placeholder={t('Account.inputUsername')}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="avatar"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Account.avatar')}</span>

        <input
          type="text"
          id="avatar"
          disabled={isValidating || isLoading}
          value={avatar || ''}
          placeholder={t('Account.inputAvatar')}
          onChange={(e) => setAvatar(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
        <Button
          variant="outline"
          disabled={loading || isValidating}
          onClick={() => updateUserInfo()}
          aria-label={t("Button.submit")}
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t("Button.submit")}
        </Button>
      </div>
    </div>
  )
}
