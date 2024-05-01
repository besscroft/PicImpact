'use client'

import { Card, CardHeader } from '@nextui-org/react'

export default function SettingsTab() {
  return (
    <div className="space-y-2">
      <Card shadow="sm">
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">系统设置</h4>
            </div>
          </div>
        </CardHeader>
      </ Card>
    </div>
  )
}