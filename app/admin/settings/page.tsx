'use client'

import React from 'react'
import { Tabs, Tab } from '@nextui-org/react'
import SettingsTab from '~/components/admin/settings/SettingsTab'
import AListTabs from '~/components/admin/settings/AListTabs'
import S3Tabs from '~/components/admin/settings/S3Tabs'

export default async function Settings() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs aria-label="设置选项卡" radius="md" variant="light">
        <Tab key="system" title="系统">
          <SettingsTab />
        </Tab>
        <Tab key="s3" title="S3">
          <S3Tabs />
        </Tab>
        <Tab key="alist" title="AList">
          <AListTabs />
        </Tab>
      </Tabs>
    </div>
  )
}