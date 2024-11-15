'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'

export default function Preferences() {
  const [title, setTitle] = useState('')
  const [customFaviconUrl, setCustomFaviconUrl] = useState('')
  const [customAuthor, setCustomAuthor] = useState('')
  const [feedId, setFeedId] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isValidating, isLoading } = useSWR('/api/v1/settings/get-custom-info', fetcher)

  async function updateInfo() {
    try {
      setLoading(true)
      await fetch('/api/v1/settings/update-custom-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          customFaviconUrl: customFaviconUrl,
          customAuthor: customAuthor,
          feedId: feedId,
          userId: userId,
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
    setTitle(data?.find((item: any) => item.config_key === 'custom_title')?.config_value || '')
    setCustomFaviconUrl(data?.find((item: any) => item.config_key === 'custom_favicon_url')?.config_value || '')
    setCustomAuthor(data?.find((item: any) => item.config_key === 'custom_author')?.config_value || '')
    setFeedId(data?.find((item: any) => item.config_key === 'rss_feed_id')?.config_value || '')
    setUserId(data?.find((item: any) => item.config_key === 'rss_user_id')?.config_value || '')
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
      <label
        htmlFor="customFaviconUrl"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> favicon </span>

        <input
          type="text"
          id="customFaviconUrl"
          disabled={isValidating || isLoading}
          value={customFaviconUrl || ''}
          placeholder="请输入 favicon 地址"
          onChange={(e) => setCustomFaviconUrl(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="customAuthor"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> 网站归属者名称 </span>

        <input
          type="text"
          id="customAuthor"
          disabled={isValidating || isLoading}
          value={customAuthor || ''}
          placeholder="请输入网站归属者名称。"
          onChange={(e) => setCustomAuthor(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="feedId"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> RSS feedId </span>

        <input
          type="text"
          id="feedId"
          disabled={isValidating || isLoading}
          value={feedId || ''}
          placeholder="请输入 RSS feedId"
          onChange={(e) => setFeedId(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="userId"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> RSS userId </span>

        <input
          type="text"
          id="userId"
          disabled={isValidating || isLoading}
          value={userId || ''}
          placeholder="请输入 RSS userId"
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
        <Button
          variant="outline"
          disabled={loading || isValidating}
          onClick={() => updateInfo()}
          aria-label="提交"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          提交
        </Button>
      </div>
    </div>
  )
}