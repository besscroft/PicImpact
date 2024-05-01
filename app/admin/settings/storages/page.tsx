'use client'

import { Tabs, Tab } from '@nextui-org/react'
import AListTabs from '~/components/admin/settings/storages/AListTabs'
import S3Tabs from '~/components/admin/settings/storages/S3Tabs'
import S3EditSheet from '~/components/admin/settings/storages/S3EditSheet'
import AListEditSheet from '~/components/admin/settings/storages/AListEditSheet'
import R2EditSheet from '~/components/admin/settings/storages/R2EditSheet'
import R2Tabs from '~/components/admin/settings/storages/R2Tabs'

export default function Storages() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs aria-label="存储选项卡" radius="md" variant="light">
        <Tab key="s3" title="S3 API">
          <S3Tabs/>
        </Tab>
        <Tab key="r2" title="Cloudflare R2">
          <R2Tabs/>
        </Tab>
        <Tab key="alist" title="AList API">
          <AListTabs/>
        </Tab>
      </Tabs>
      <S3EditSheet />
      <R2EditSheet />
      <AListEditSheet />
    </div>
  )
}