'use client'

import React, { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

export default function Preferences() {
  const [title, setTitle] = useState('')
  const [customFaviconUrl, setCustomFaviconUrl] = useState('')
  const [customAuthor, setCustomAuthor] = useState('')
  const [feedId, setFeedId] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [customIndexStyle, setCustomIndexStyle] = useState('')
  const [previewImageMaxWidth, setPreviewImageMaxWidth] = useState('0')
  const [customIndexDownloadEnable, setCustomIndexDownloadEnable] = useState(false)
  const [enablePreviewImageMaxWidthLimit, setPreviewImageMaxWidthLimitEnabled] = useState(false)
  const [previewQualityInput, setPreviewQualityInput] = useState('0.2')
  const [customFoldAlbumEnable, setCustomFoldAlbumEnable] = useState(false)
  const [customFoldAlbumCount, setCustomFoldAlbumCount] = useState('6')
  const t = useTranslations()

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
          customIndexStyle: customIndexStyle,
          customIndexDownloadEnable: customIndexDownloadEnable,
          enablePreviewImageMaxWidthLimit,
          previewImageMaxWidth: maxWidth,
          previewQuality,
          customFoldAlbumEnable: customFoldAlbumEnable,
          customFoldAlbumCount: customFoldAlbumCount,
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
    setCustomIndexStyle(data?.find((item) => item.config_key === 'custom_index_style')?.config_value || '0')
    setCustomIndexDownloadEnable(data?.find((item) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' || false)
    setPreviewImageMaxWidth(data?.find((item) => item.config_key === 'preview_max_width_limit')?.config_value?.toString() || '0')
    setPreviewImageMaxWidthLimitEnabled(data?.find((item) => item.config_key === 'preview_max_width_limit_switch')?.config_value === '1')
    setPreviewQualityInput(data?.find((item) => item.config_key === 'preview_quality')?.config_value || '0.2')
    setCustomFoldAlbumEnable(data?.find((item) => item.config_key === 'custom_fold_album_enable')?.config_value.toString() === 'true' || false)
    setCustomFoldAlbumCount(data?.find((item) => item.config_key === 'custom_fold_album_count')?.config_value || '6')
  }, [data])

  return (
    <div className="space-y-2">
      <label
        htmlFor="title"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.webSiteTitle')}</span>

        <input
          type="text"
          id="title"
          disabled={isValidating || isLoading}
          value={title || ''}
          placeholder={t('Preferences.inputWebSiteTitle')}
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
          placeholder={t('Preferences.favicon')}
          onChange={(e) => setCustomFaviconUrl(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="customAuthor"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.webAuthor')}</span>

        <input
          type="text"
          id="customAuthor"
          disabled={isValidating || isLoading}
          value={customAuthor || ''}
          placeholder={t('Preferences.inputWebAuthor')}
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
          placeholder={t('Preferences.inputFeedId')}
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
          placeholder={t('Preferences.inputUserId')}
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <div className="w-full sm:w-64">
        <Select value={customIndexStyle} onValueChange={(value) => setCustomIndexStyle(value)}>
          <SelectTrigger>
            <SelectValue placeholder={t('Preferences.indexStyleSelect')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t('Preferences.indexStyleDefault')}</SelectItem>
            <SelectItem value="1">{t('Preferences.indexStyleStar')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label
        htmlFor="previewQuality"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.previewQuality')}</span>

        <input
          type="text"
          id="previewQuality"
          disabled={isValidating || isLoading}
          value={previewQualityInput}
          placeholder={t('Preferences.inputPreviewQuality')}
          onChange={(e) => setPreviewQualityInput(e.target.value)}
          className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
        />
      </label>
      <label
        htmlFor="customIndexDownloadEnable"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.customIndexDownloadEnable')}</span>
        <div>
          <Switch
            id="customIndexDownloadEnable"
            disabled={isValidating || isLoading}
            checked={customIndexDownloadEnable}
            onCheckedChange={checked => {
              setCustomIndexDownloadEnable(checked)
            }}
          />
        </div>
      </label>
      <div className="flex gap-4">
        <label
          htmlFor="enableMaxWidthLimit"
          className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
        >
          <span className="text-xs font-medium text-gray-700">{t('Preferences.enableMaxWidthLimit')}</span>
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
          <span className="text-xs font-medium text-gray-700">{t('Preferences.maxWidth')}</span>
          <input
            type="text"
            id="maxWidth"
            disabled={isValidating || isLoading}
            value={previewImageMaxWidth}
            placeholder={t('Preferences.inputMaxWidth')}
            onChange={(e) => setPreviewImageMaxWidth(e.target.value)}
            className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />
        </label>
      </div>
      <label
        htmlFor="customFoldAlbumEnable"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.customFoldAlbumEnable')}</span>
        <div>
          <Switch
            id="customFoldAlbumEnable"
            disabled={isValidating || isLoading}
            checked={customFoldAlbumEnable}
            onCheckedChange={checked => {
              setCustomFoldAlbumEnable(checked)
            }}
          />
        </div>
      </label>
      <label
        htmlFor="customFoldAlbumCount"
        className="w-full sm:w-64 block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
      >
        <span className="text-xs font-medium text-gray-700">{t('Preferences.customFoldAlbumCount')}</span>
        <input
          type="number"
          id="customFoldAlbumCount"
          disabled={isValidating || isLoading || !customFoldAlbumEnable}
          value={customFoldAlbumCount}
          min="1"
          onChange={(e) => setCustomFoldAlbumCount(e.target.value)}
          className={`mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm ${
            !customFoldAlbumEnable ? 'text-gray-500 cursor-not-allowed' : ''
          }`}
        />
      </label>
      <div className="flex w-full sm:w-64 items-center justify-center space-x-1">
        <Button
          variant="outline"
          disabled={loading || isValidating}
          onClick={() => updateInfo()}
          aria-label={t("Button.submit")}
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t("Button.submit")}
        </Button>
      </div>
    </div>
  )
}
