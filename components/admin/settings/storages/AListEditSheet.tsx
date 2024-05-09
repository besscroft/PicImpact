'use client'

import { Config } from '~/types'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/Sheet'
import { Button, Input } from '@nextui-org/react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'

export default function AListEditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { aListEdit, setAListEdit, setAListEditData, aListData } = useButtonStore(
    (state) => state,
  )

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/update-alist-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(aListData),
      }).then(res => res.json())
      toast.success('更新成功！')
      mutate('/api/v1/alist-info')
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
      setAListEdit(false)
      setAListEditData([] as Config[])
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={aListEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setAListEdit(false)
          setAListEditData([] as Config[])
        }
      }}
      modal={false}
    >
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>编辑 AList</SheetTitle>
          <SheetDescription className="space-y-2">
            {
              aListData?.map((config: Config) => (
                <Input
                  isRequired
                  key={config.id}
                  value={config.config_value}
                  onValueChange={(value) => setAListEditData(
                    aListData?.map((c: Config) => {
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