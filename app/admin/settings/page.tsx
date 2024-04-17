'use client'

import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  return (
    <div className="h-ful flex justify-center items-center">
      <div className="text-center flex flex-col items-center">
        <SettingsIcon />
        <span className="text-xl">在左侧选择一个设置</span>
      </div>
    </div>
  )
}