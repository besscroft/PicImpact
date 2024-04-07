'use client'

import React from 'react'
import {Tabs, Tab, Card, CardBody} from '@nextui-org/react'

export default async function Settings() {
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs aria-label="设置选项卡" radius="md" variant="light">
        <Tab key="system" title="系统">
          <Card>
            <CardBody>
              系统设置
            </CardBody>
          </Card>
        </Tab>
        <Tab key="s3" title="S3">
          <Card>
            <CardBody>
              S3 设置
            </CardBody>
          </Card>
        </Tab>
        <Tab key="alist" title="AList">
          <Card>
            <CardBody>
              AList 设置
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  )
}