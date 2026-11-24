'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'
import { Textarea } from '~/components/ui/textarea'
import { authClient } from '~/server/auth/auth-client'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Label } from '~/components/ui/label'

export default function Preferences() {
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const { data: session, isPending } = authClient.useSession()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [onePwd, setOnePwd] = useState('')
  const [twoPwd, setTwoPwd] = useState('')
  const [threePwd, setThreePwd] = useState('')
  
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

  async function updatePassword() {
    // 校验旧密码规则，不小于 8 位
    if (twoPwd.length < 8) {
      toast.error('旧密码不能小于 8 位！')
      return
    }
    // 校验新密码规则，不小于 8 位
    if (onePwd.length < 8) {
      toast.error('新密码不能小于 8 位！')
      return
    }
    // 校验 2 个新密码是否一致
    if (twoPwd !== threePwd) {
      toast.error('两次输入的新密码不一致！')
      return
    }
    try {
      setPasswordLoading(true)
      const { error } = await authClient.changePassword({
        newPassword: threePwd,
        currentPassword: onePwd,
        revokeOtherSessions: true, // revoke all other sessions the user is signed into
      })
      if (error) {
        toast.error('修改失败！')
      } else {
        toast.success('修改成功！')
      }
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setPasswordLoading(false)
    }
  }

  useEffect(()=>{
    setAvatar(session?.user?.image?.toString() || '')
  },[session])

  return (
    <div className="flex flex-col space-y-4 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div>{t('Link.account')}</div>
      </div>
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label>{t('Account.avatar')}</Label>
          <Textarea
            id="avatar"
            disabled={isPending}
            value={avatar || ''}
            placeholder={t('Account.inputAvatar')}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
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
      <Separator className="ww-full max-w-sm" />
      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="onePassword"> {t('Password.onePassword')} </Label>
          <Input
            type="text"
            id="onePassword"
            value={onePwd || ''}
            placeholder={t('Password.inputOldPassword')}
            onChange={(e) => setOnePwd(e.target.value)}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="twoPassword"> {t('Password.twoPassword')} </Label>
          <Input
            type="text"
            id="twoPassword"
            value={twoPwd || ''}
            placeholder={t('Password.inputTwoPassword')}
            onChange={(e) => setTwoPwd(e.target.value)}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="threePassword"> {t('Password.threePassword')} </Label>
          <Input
            type="text"
            id="threePassword"
            value={threePwd || ''}  
            placeholder={t('Password.inputThreePassword')}
            onChange={(e) => setThreePwd(e.target.value)}
          />
        </div>
        <Button
            variant="outline"
            className="cursor-pointer"
            disabled={passwordLoading}
            type="submit"
            aria-label={t('Button.submit')}
            onClick={() => updatePassword()}
          >
            {passwordLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            {t('Button.submit')}
          </Button>
      </div>
    </div>
  )
}
