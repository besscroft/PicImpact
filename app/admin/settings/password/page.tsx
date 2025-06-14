'use client'

import React, { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '~/components/ui/form'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { authClient } from '~/server/auth/auth-client'

export default function PassWord() {
  const [loading, setLoading] = useState(false)
  const t = useTranslations()
  const formRef = useRef<HTMLFormElement>(null)

  const FormSchema = z.object({
    onePassword: z.string()
      .min(1, {
        message: '旧密码必填',
      }),
    twoPassword: z.string()
      .min(8, {
        message: '密码不能少于8位数',
      })
      .max(20, {
        message: '密码不能超过20位数',
      }),
    threePassword: z.string()
      .min(8, {
        message: '密码不能少于8位数',
      })
      .max(20, {
        message: '密码不能超过20位数',
      }),
  }).refine((data: any) => data.twoPassword === data.threePassword, {
      message: '两次密码不一致',
      path: ['threePassword'], // 错误信息指向 confirmPassword 字段
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      onePassword: '',
      twoPassword: '',
      threePassword: '',
    },
  })

  async function updatePassword(data: z.infer<typeof FormSchema>) {
    if (data.onePassword === '') {
      toast.error('请输入旧密码！')
      return
    }
    if (data.twoPassword === '') {
      toast.error('请输入新密码！')
      return
    }
    if (data.threePassword === '') {
      toast.error('请再次输入新密码！')
      return
    }
    if (data.twoPassword !== data.threePassword) {
      toast.error('两次密码输入不一致！')
      return
    }
    try {
      setLoading(true)
      const { error } = await authClient.changePassword({
        newPassword: data.twoPassword,
        currentPassword: data.onePassword,
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
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-4 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div>{t('Link.password')}</div>
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={loading}
          aria-label={t('Button.submit')}
          onClick={() => formRef.current?.requestSubmit()}
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Button.submit')}
        </Button>
      </div>
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(updatePassword)} className="w-full max-w-sm space-y-6">
          <FormField
            control={form.control}
            name="onePassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="onePassword">{t('Password.onePassword')}</Label>
                    <Input
                      type="password"
                      id="onePassword"
                      placeholder={t('Password.inputOldPassword')}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="twoPassword"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="twoPassword">{t('Password.twoPassword')}</Label>
                    <Input
                      type="password"
                      id="twoPassword"
                      placeholder={t('Password.inputTwoPassword')}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="threePassword"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="threePassword">{t('Password.threePassword')}</Label>
                    <Input
                      type="password"
                      id="threePassword"
                      placeholder={t('Password.inputThreePassword')}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
}