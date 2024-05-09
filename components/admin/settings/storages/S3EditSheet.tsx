'use client'

import { Config } from '~/types'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { Button, Input } from '@nextui-org/react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'

export default function S3EditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { s3Edit, setS3Edit, setS3EditData, s3Data } = useButtonStore(
    (state) => state,
  )

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/update-s3-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(s3Data),
      }).then(res => res.json())
      toast.success('更新成功！')
      mutate('/api/v1/s3-info')
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
      setS3Edit(false)
      setS3EditData([] as Config[])
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={s3Edit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setS3Edit(false)
          setS3EditData([] as Config[])
        }
      }}
      modal={false}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>编辑 S3</SheetTitle>
          <SheetDescription className="space-y-2">
            {
              s3Data?.map((config: Config) => (
                <Input
                  isRequired
                  key={config.id}
                  value={config.config_value}
                  onValueChange={(value) => setS3EditData(
                    s3Data?.map((c: Config) => {
                      if (c.config_key === config.config_key) {
                        c.config_value = value
                      }
                      return c
                    })
                  )}
                  isClearable
                  type="text"
                  variant="bordered"
                  label={config.config_key}
                  placeholder={`输入${config.config_key}`}
                />
              ))
            }
            <Button
              isLoading={loading}
              color="primary"
              variant="shadow"
              onClick={() => submit()}
              aria-label="更新"
            >
              更新
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}