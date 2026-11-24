'use client'

import React, { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useTranslations } from 'next-intl'
import SimpleFileUpload from '~/components/admin/upload/simple-file-upload'
import MultipleFileUpload from '~/components/admin/upload/multiple-file-upload'
import LivephotoFileUpload from '~/components/admin/upload/livephoto-file-upload'

export default function FileUpload() {
  const [mode, setMode] = useState('singleton')
  const t = useTranslations()

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex items-center w-full sm:w-64 md:w-80">
          <Select
            value={mode}
            onValueChange={(value: string) => {
              setMode(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Upload.selectUploadMode')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem key="singleton" value="singleton">
                  {t('Upload.simple')}
                </SelectItem>
                <SelectItem key="livephoto" value="livephoto">
                  {t('Upload.livephoto')}
                </SelectItem>
                <SelectItem key="multiple" value="multiple">
                  {t('Upload.multiple')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      {
        mode === 'multiple' ?
          <MultipleFileUpload />
          : mode === 'livephoto' ?
          <LivephotoFileUpload />
          :
          <SimpleFileUpload />
      }
    </div>
  )
}
