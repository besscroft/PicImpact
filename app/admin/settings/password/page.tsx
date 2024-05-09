'use client'

import { Card, CardBody, Input, Button } from '@nextui-org/react'
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function PassWord() {
  const [isOneVisible, setIsOneVisible] = useState(false)
  const [isTwoVisible, setIsTwoVisible] = useState(false)
  const [isThreeVisible, setIsThreeVisible] = useState(false)
  const [onePassword, setOnePassword] = useState('')
  const [twoPassword, setTwoPassword] = useState('')
  const [threePassword, setThreePassword] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleOneVisibility = () => setIsOneVisible(!isOneVisible)
  const toggleTwoVisibility = () => setIsTwoVisible(!isTwoVisible)
  const toggleThreeVisibility = () => setIsThreeVisible(!isThreeVisible)

  async function updatePassword() {
    if (onePassword === '') {
      toast.error('请输入旧密码！')
      return
    }
    if (twoPassword === '') {
      toast.error('请输入新密码！')
      return
    }
    if (threePassword === '') {
      toast.error('请再次输入新密码！')
      return
    }
    if (twoPassword !== threePassword) {
      toast.error('两次密码输入不一致！')
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: onePassword,
          newPassword: twoPassword
        }),
      }).then(res => res.json())
      toast.success('修改成功！')
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex-1" shadow="sm">
      <CardBody className="space-y-2">
        <Input
          isRequired
          variant="bordered"
          label="旧密码"
          className="w-full sm:w-64"
          value={onePassword}
          onValueChange={(value: string) => setOnePassword(value)}
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleOneVisibility}>
              {isOneVisible ? (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          type={isOneVisible ? 'text' : 'password'}
        />
        <Input
          isRequired
          variant="bordered"
          label="新密码"
          className="w-full sm:w-64"
          value={twoPassword}
          onValueChange={(value: string) => setTwoPassword(value)}
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleTwoVisibility}>
              {isTwoVisible ? (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          type={isTwoVisible ? 'text' : 'password'}
        />
        <Input
          isRequired
          variant="bordered"
          label="再次确认新密码"
          className="w-full sm:w-64"
          value={threePassword}
          onValueChange={(value: string) => setThreePassword(value)}
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleThreeVisibility}>
              {isThreeVisible ? (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          type={isThreeVisible ? 'text' : 'password'}
        />
        <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
          <Button
            color="primary"
            variant="bordered"
            onClick={() => {
              setOnePassword('')
              setTwoPassword('')
              setThreePassword('')
            }}
            aria-label="重置"
          >
            重置
          </Button>
          <Button
            color="primary"
            variant="bordered"
            isLoading={loading}
            onClick={() => updatePassword()}
            aria-label="提交"
          >
            提交
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}