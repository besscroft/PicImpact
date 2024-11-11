'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { Input } from '~/components/ui/input'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'

export default function Preferences() {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isValidating, isLoading } = useSWR('/api/v1/settings/get-custom-title', fetcher)

  async function updateTitle() {
    try {
      setLoading(true)
      await fetch('/api/v1/settings/update-custom-title', {
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
    setTitle(data?.config_value || '')
  }, [data])

  return (
    <div className="space-y-2">
      <label
        htmlFor="title"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> 网站标题 </span>

        <input
          type="text"
          id="title"
          disabled={isValidating || isLoading}
          value={title || ''}
          placeholder="请输入网站标题。"
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => updateTitle()}
          aria-label="提交"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          提交
        </Button>
      </div>
    </div>
  )
}