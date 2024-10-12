'use client'

import {
  Button,
  Card,
  CardBody,
  Code,
  Link,
  Chip,
  ModalContent,
  ModalHeader,
  ModalFooter, Modal
} from '@nextui-org/react'
import { toast } from 'sonner'
import React, {useEffect, useState} from 'react'
import { useQRCode } from 'next-qrcode'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '~/components/ui/input-otp'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'

export default function Authenticator() {
  const [password, setPassword] = useState('')
  const [uri, setUri] = useState('')
  const [secret, setSecret] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { data, isValidating, isLoading, mutate } = useSWR('/api/open/get-auth-status', fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )

  console.log(data?.data?.auth_enable)

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
      setIsOpen(false)
      await mutate()
      await getQRCode()
    }
  }

  useEffect(() => {
    getQRCode()
  }, [])

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card shadow="sm">
        {
          isValidating ? <p className="m-2">同步状态中...</p>
            : data?.data?.auth_enable === 'true' ?
              <CardBody className="space-y-2">
                <Chip color="success">双因素验证已启用</Chip>
                <Button className="w-36" color="danger" onClick={() => setIsOpen(true)}>
                  移除双因素验证
                </Button>
              </CardBody>
              : <CardBody className="space-y-2">
                <h4 className="text-medium font-medium">第一步</h4>
                <p className="text-small text-default-400">下载任意两步验证手机应用：</p>
                <Link
                  isExternal
                  href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                  showAnchorIcon
                >
                  Google Authenticator
                </Link>
                <Link
                  isExternal
                  href="https://www.microsoft.com/en-us/security/mobile-authenticator-app"
                  showAnchorIcon
                >
                  Microsoft Authenticator
                </Link>
                <Link
                  isExternal
                  href="https://support.1password.com/one-time-passwords/"
                  showAnchorIcon
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
                <Code className="w-full sm:w-64" color="success">{secret || 'N&A'}</Code>
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
                    onClick={async () => {
                      setPassword('')
                      setUri('')
                      setSecret('')
                      await getQRCode()
                    }}
                    className="w-full sm:w-64"
                    color="primary"
                    variant="shadow"
                  >
                    重新获取
                  </Button>
                  <Button
                    onClick={() => saveAuthTemplateToken()}
                    isDisabled={password.length !== 6}
                    className="w-full sm:w-64"
                    color="primary"
                    variant="shadow"
                  >
                    完成设置
                  </Button>
                </div>
              </CardBody>
        }
      </Card>
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要移除双因素验证？</ModalHeader>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => setIsOpen(false)}
              aria-label="不移除"
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => removeAuth()}
              aria-label="确认移除"
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}