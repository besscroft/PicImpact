'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'

export default function Preferences() {
  const [title, setTitle] = useState('')
  const [customFaviconUrl, setCustomFaviconUrl] = useState('')
  const [customAuthor, setCustomAuthor] = useState('')
  const [feedId, setFeedId] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewImageMaxWidth, setPreviewImageMaxWidth] = useState('0')
  const [enablePreviewImageMaxWidthLimit, setPreviewImageMaxWidthLimitEnabled] = useState(false)
  const [previewQualityInput, setPreviewQualityInput] = useState('0.2')

  const { data, isValidating, isLoading } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  async function updateInfo() {
    const maxWidth = parseInt(previewImageMaxWidth)
    if (isNaN(maxWidth) || maxWidth < 0) {
      toast.error('预览图最大宽度限制不能小于 0')
      return
    }
    const previewQuality = parseFloat(previewQualityInput)
    if (isNaN(previewQuality) || previewQuality <= 0 || previewQuality > 1) {
      toast.error('预览图压缩质量只支持0-1，大于0')
      return
    }
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
          enablePreviewImageMaxWidthLimit,
          previewImageMaxWidth: maxWidth,
          previewQuality,
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
    setTitle(data?.find((item) => item.config_key === 'custom_title')?.config_value || '')
    setCustomFaviconUrl(data?.find((item) => item.config_key === 'custom_favicon_url')?.config_value || '')
    setCustomAuthor(data?.find((item) => item.config_key === 'custom_author')?.config_value || '')
    setFeedId(data?.find((item) => item.config_key === 'rss_feed_id')?.config_value || '')
    setUserId(data?.find((item) => item.config_key === 'rss_user_id')?.config_value || '')
    setPreviewImageMaxWidth(data?.find((item) => item.config_key === 'preview_max_width_limit')?.config_value?.toString() || '0')
    setPreviewImageMaxWidthLimitEnabled(data?.find((item) => item.config_key === 'preview_max_width_limit_switch')?.config_value === '1')
    setPreviewQualityInput(data?.find((item) => item.config_key === 'preview_quality')?.config_value || '0.2')
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
      <label
        htmlFor="previewQuality"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> 预览图压缩质量(0-1，大于0) </span>

        <input
          type="text"
          id="userId"
          disabled={isValidating || isLoading}
          value={previewQualityInput}
          placeholder="请输入预览图压缩质量"
          onChange={(e) => setPreviewQualityInput(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <div className="flex gap-4">
      <label
        htmlFor="enableMaxWidthLimit"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> 预览图最大尺寸限制开关 </span>
        <div>
        <Switch
          id="enableMaxWidthLimit"
          disabled={isValidating || isLoading}
          checked={enablePreviewImageMaxWidthLimit}
          onCheckedChange={checked => {
            setPreviewImageMaxWidthLimitEnabled(checked)
          }}
        />
        </div>
      </label>
      <label
        htmlFor="maxWidth"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700"> 预览图最大宽度(正整数) </span>
        <input
          type="text"
          id="maxWidth"
          disabled={isValidating || isLoading}
          value={previewImageMaxWidth}
          placeholder="请输入预览图最大宽度限制，正整数"
          onChange={(e) => setPreviewImageMaxWidth(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      </div>
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
