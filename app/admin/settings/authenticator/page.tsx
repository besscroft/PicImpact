'use client'

import { toast } from 'sonner'
import React, { useState } from 'react'
import { useQRCode } from 'next-qrcode'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
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
import { useTranslations } from 'next-intl'
import { authClient } from '~/server/auth/auth-client'
import { Input } from '~/components/ui/input.tsx'

export default function Authenticator() {
  const t = useTranslations()
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [uri, setUri] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: session, isPending } = authClient.useSession()

  async function enable2FA() {
    if (!password) {
      toast.error('必须填密码！')
      return
    }
    const { data, error } = await authClient.twoFactor.enable({
      password: password,
      issuer: 'PicImpact',
    })

    if (error) {
      toast.error('验证失败，无法启用！')
    }

    if (data) {
      setUri(data.totpURI)
    }
    console.log(data)
  }

  const { SVG } = useQRCode()

  async function verifyTotpHandle() {
    try {
      const { error } = await authClient.twoFactor.verifyTotp({
        code: otpCode
      })
      if (error) {
        toast.error(t('Tips.setupFailed'))
      } else {
        toast.success(t('Tips.setupSuccess'))
      }
    } catch {
      toast.error(t('Tips.setupFailed'))
    }
  }

  async function disable2FA() {
    try {
      setDeleteLoading(true)
      const { error } = await authClient.twoFactor.disable({
        password: password
      })
      if (error) {
        toast.error(t('Tips.removeFailed'))
      } else {
        toast.success(t('Tips.removeSuccess'))
      }
    } catch (e) {
      toast.error(t('Tips.removeFailed'))
    } finally {
      setPassword('')
      setUri('')
      setDeleteLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      {
        isPending ? <p className="m-2">{t('Tips.syncingStatus')}</p>
          : session?.user?.twoFactorEnabled ?
            <div className="flex flex-col space-y-2">
              <Alert className="!md:w-64">
                <RocketIcon className="h-4 w-4" />
                <AlertTitle>{t('Tips.congratulations')}</AlertTitle>
                <AlertDescription>
                  {t('Tips.twoFactorEnabled')}
                </AlertDescription>
              </Alert>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer w-36" variant="destructive">
                    {t('Button.removeTwoFactor')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('Tips.confirmRemoveTwoFactor')}</DialogTitle>
                  </DialogHeader>
                  <DialogFooter className={'flex items-center sm:justify-center'}>
                    <div className="flex flex-col full space-y-2">
                      <Input
                        id="password"
                        className="w-full sm:w-64"
                        type="password"
                        required
                        value={password}
                        placeholder="请输入密码"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        className="cursor-pointer"
                        onClick={() => disable2FA()}
                        disabled={deleteLoading}
                        variant="destructive"
                      >
                        {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
                        {t('Tips.yes')}
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            : <div className="space-y-2">
              <h4 className="text-medium font-medium">{t('Tips.stepOne')}</h4>
              <Input
                id="password"
                className="w-full sm:w-64"
                type="password"
                required
                value={password}
                placeholder="请输入密码"
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                variant="outline"
                className="cursor-pointer w-full sm:w-64"
                onClick={async () => {
                  await enable2FA()
                }}
              >
                生成二维码
              </Button>
              <h4 className="text-medium font-medium">{t('Tips.stepTwo')}</h4>
              <p className="text-small text-default-400">{t('Tips.scanQRCode')}</p>
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
              <h4 className="text-medium font-medium">{t('Tips.stepThree')}</h4>
              <p className="text-small text-default-400">{t('Tips.enterSixDigits')}</p>
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value: string) => setOtpCode(value)}
                onComplete={(value: string) => setOtpCode(value)}
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
              <div className="gap space-y-2 w-full sm:w-64">
                <Button
                  variant="outline"
                  onClick={() => verifyTotpHandle()}
                  className="cursor-pointer w-full sm:w-64"
                  disabled={otpCode.length !== 6}
                >
                  {t('Tips.completeSetup')}
                </Button>
              </div>
            </div>
      }
    </div>
  )
}