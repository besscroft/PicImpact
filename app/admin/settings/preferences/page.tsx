'use client'

import { Button, Card, CardBody, Input } from '@nextui-org/react'
import React, {useEffect, useState} from 'react'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { toast } from 'sonner'

export default function Preferences() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const { data } = useSWR('/api/v1/get-custom-title', fetcher)

  async function updateTitle() {
    try {
      setLoading(true)
      await fetch('/api/v1/update-custom-title', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
        }),
      }).then(res => res.json())
      toast.success('修改成功！')
    } catch (e) {
      toast.error('修改失败！')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setTitle(data?.config_value)
  }, data)

  return (
    <Card className="flex-1" shadow="sm">
      <CardBody className="space-y-2">
        <Input
          isRequired
          variant="bordered"
          value={title}
          type="text"
          label="网站标题"
          className="w-full sm:w-64"
          onValueChange={(value: string) => setTitle(value)}
        />
        <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
          <Button
            color="primary"
            variant="bordered"
            isLoading={loading}
            onClick={() => updateTitle()}
            aria-label="提交"
          >
            提交
          </Button>
        </div>
      </CardBody>
    </Card>
)
}