'use client'

import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { useQRCode } from 'next-qrcode'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { RocketIcon, ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import Link from 'next/link'

export default function Authenticator() {
  const [password, setPassword] = useState('')
  const [uri, setUri] = useState('')
  const [secret, setSecret] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { data, isValidating, isLoading, mutate } = useSWR('/api/open/get-auth-status', fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )

  async function getQRCode() {
    try {
      const res = await fetch('/api/v1/auth/get-seed-secret', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(res => res.json())
      if (res.code === 200) {
        setUri(res.data.uri)
        setSecret(res.data.secret)
      }
    } catch (e) {
      toast.error('令牌颁发失败！')
    }
  }

  const { SVG } = useQRCode()

  async function saveAuthTemplateToken() {
    try {
      const res = await fetch('/api/v1/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: password })
      }).then(res => res.json())
      if (res.code === 200) {
        toast.success('设置成功！')
      } else {
        toast.error('设置失败！')
      }
    } catch (e) {
      toast.error('设置失败！')
    } finally {
      await mutate()
    }
  }

  async function removeAuth() {
    try {
      setDeleteLoading(true)
      const res = await fetch('/api/v1/auth/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
      if (res.code === 200) {
        toast.success('移除成功！')
      } else {
        toast.error('移除失败！')
      }
    } catch (e) {
      toast.error('移除失败！')
    } finally {
      setPassword('')
      setUri('')
      setSecret('')
      setDeleteLoading(false)
      await mutate()
      await getQRCode()
    }
  }

  useEffect(() => {
    getQRCode()
  }, [])

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      {
        isValidating ? <p className="m-2">同步状态中...</p>
          : data?.data?.auth_enable === 'true' ?
            <div className="flex flex-col space-y-2">
              <Alert className="!md:w-64">
                <RocketIcon className="h-4 w-4" />
                <AlertTitle>恭喜!</AlertTitle>
                <AlertDescription>
                  双因素验证已启用
                </AlertDescription>
              </Alert>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer w-36" variant="destructive">
                    移除双因素验证
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>确定要移除双因素验证？</DialogTitle>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      className="cursor-pointer"
                      onClick={() => removeAuth()}
                      disabled={deleteLoading}
                      variant="destructive"
                    >
                      {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                      是的
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            : <div className="space-y-2">
              <h4 className="text-medium font-medium">第一步</h4>
              <p className="text-small text-default-400">下载任意两步验证手机应用：</p>
              <Link
                className="mx-2"
                target='_blank'
                href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              >Google Authenticator</Link>
              <Link
                className="mx-2"
                target='_blank'
                href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
              >
                Microsoft Authenticator
              </Link>
              <Link
                className="mx-2"
                target='_blank'
                href="https://support.1password.com/one-time-passwords/"
              >
                1Password
              </Link>
              <h4 className="text-medium font-medium">第二步</h4>
              <p className="text-small text-default-400">使用手机应用扫描二维码：</p>
              {
                uri &&
                <SVG
                  text={uri}
                  options={{
                    margin: 2,
                    width: 180,
                    color: {
                      dark: '#010599FF',
                      light: '#FFBF60FF',
                    },
                  }}
                />
              }
              <p className="text-small text-default-400">或者输入秘钥：</p>
              <div className="w-full sm:w-64">{secret || 'N&A'}</div>
              <h4 className="text-medium font-medium">第三步</h4>
              <p className="text-small text-default-400">输入手机应用上的6位数字：</p>
              <InputOTP
                maxLength={6}
                value={password}
                onChange={(value: string) => setPassword(value)}
                onComplete={(value: string) => setPassword(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <div className="flex items-center justify-center space-x-2 w-full sm:w-64">
                <Button
                  variant="outline"
                  className="cursor-pointer w-full sm:w-64"
                  onClick={async () => {
                    setPassword('')
                    setUri('')
                    setSecret('')
                    await getQRCode()
                  }}
                >
                  重新获取
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveAuthTemplateToken()}
                  className="cursor-pointer w-full sm:w-64"
                  disabled={password.length !== 6}
                >
                  完成设置
                </Button>
              </div>
            </div>
      }
    </div>
  )
}