'use client'

import { Tabs, Tab } from '@nextui-org/react'
import AListTabs from '~/components/admin/settings/AListTabs'
import S3Tabs from '~/components/admin/settings/S3Tabs'

export default function Storages() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs aria-label="存储选项卡" radius="md" variant="light">
        <Tab key="s3" title="S3">
          <S3Tabs/>
        </Tab>
        <Tab key="alist" title="AList">
          <AListTabs/>
        </Tab>
      </Tabs>
    </div>
  )
}