'use client'

import { DataProps, ImageServerHandleProps, ImageType } from '~/types'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Select, Space } from 'antd'
import { toast } from 'sonner'
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
import ListImage from '~/components/admin/list/ListImage'

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: DataProps } & { pageNum: number } & { tag: string }>) {
  const { dataProps, pageNum, tag, ...restProps } = props
  const { mutate } = useSWRInfiniteServerHook(restProps, pageNum, tag)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([] as any[])

  const fieldNames = { label: 'name', value: 'id' }

  async function submit() {
    if (data.length === 0) {
      toast.warning('请选择要删除的图片')
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/batch-delete', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'DELETE',
      }).then(response => response.json())
      toast.success('删除成功！')
      setImageBatchDelete(false)
      setData([])
      await mutate()
    } catch (e) {
      toast.error('删除失败！')
    } finally {
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={imageBatchDelete}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageBatchDelete(false)
          setData([])
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>批量删除</SheetTitle>
          <SheetDescription className="space-y-2">
            {
              Array.isArray(data) && data.length > 0 &&
              <div className="grid grid-cols-3">
                {dataProps.data.filter((item: ImageType) => data.includes(item.id)).map((image: ImageType) => (
                  <ListImage key={image.id} image={image} />
                ))}
              </div>
            }
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="选择您要删除的图片"
              onChange={(value: any) => setData(value)}
              options={dataProps.data}
              fieldNames={fieldNames}
              optionRender={(option) => (
                <Space>
                  <span role="img" aria-label={option.data.id}>
                    id: {option.data.id}
                  </span>
                  name: {option.data.name || '无'}
                </Space>
              )}
              onClear={() => setData([])}
            />
            <Button
              color="primary"
              variant="shadow"
              onClick={() => {
                if (data.length === 0) {
                  toast.warning('请选择要删除的图片')
                  return
                } else {
                  setIsOpen(true)
                }
              }}
              aria-label="更新"
            >
              更新
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要删掉？</ModalHeader>
          <ModalBody>
            <p>图片 ID：{JSON.stringify(data)}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="flat"
              onClick={() => {
                setIsOpen(false)
              }}
              aria-label="不删除"
            >
              算了
            </Button>
            <Button
              color="danger"
              isLoading={loading}
              onClick={() => submit()}
              aria-label="确认删除"
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Sheet>
  )
}