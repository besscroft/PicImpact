'use client'

import { Tabs } from '~/components/aceternity/tabs'
import AListTabs from '~/components/admin/settings/storages/AListTabs'
import S3Tabs from '~/components/admin/settings/storages/S3Tabs'
import R2Tabs from '~/components/admin/settings/storages/R2Tabs'

export default function Storages() {
  const tabs = [
    {
      title: "S3 API",
      value: "s3",
      content: (
        <S3Tabs />
      ),
    },
    {
      title: "Cloudflare R2",
      value: "r2",
      content: (
        <R2Tabs />
      ),
    },
    {
      title: "AList API",
      value: "alist",
      content: (
        <AListTabs />
      ),
    },
  ];

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs tabs={tabs} />
    </div>
  )
}