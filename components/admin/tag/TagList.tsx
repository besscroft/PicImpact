'use client'

import React, { useState } from 'react'
import { HandleProps } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@nextui-org/react'
import { ArrowDown10 } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/ContextMenu'
import { toast } from 'sonner'
import DefaultTag from '~/components/admin/tag/DefaultTag'
import { TagType } from '~/types'
import { useButtonStore } from '~/app/providers/button-store-Providers'


export default function TagList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [isOpen, setIsOpen] = useState(false)
  const [tag, setTag] = useState({} as TagType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { setTagEdit, setTagEditData } = useButtonStore(
    (state) => state,
  )

  async function deleteTag() {
    setDeleteLoading(true)
    if (!tag.id) return
    try {
      const res = await fetch(`/api/v1/tag-delete/${tag.id}`, {
        method: 'DELETE',
      })
      if (res.status === 200) {
        toast.success('删除成功！')
        setIsOpen(false)
        await mutate()
      } else {
        toast.error('删除失败！')
      }
    } catch (e) {
      toast.error('删除失败！')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {
          !isLoading && !error && data ?
            <>
              <DefaultTag/>
              {data.map((tag: TagType) => (
                <ContextMenu key={tag.id}>
                  <ContextMenuTrigger>
                    <Card shadow="sm">
                      <CardHeader className="flex gap-3">
                        <p>{tag.name}</p>
                        <Popover placement="top">
                          <PopoverTrigger className="cursor-pointer">
                            <Chip className="select-none" color="success" variant="shadow">{tag.tag_value}</Chip>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="px-1 py-2 select-none">
                              <div className="text-small font-bold">路由</div>
                              <div className="text-tiny">可以访问的一级路径</div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </CardHeader>
                      <CardBody>
                        <p>{tag.detail || '没有介绍'}</p>
                      </CardBody>
                      <CardFooter className="flex space-x-1 select-none">
                        {
                          tag.show === 0 ?
                            <Chip color="success" variant="shadow">显示</Chip>
                            :
                            <Chip color="danger" variant="shadow">不显示</Chip>
                        }
                        <Popover placement="top">
                          <PopoverTrigger className="cursor-pointer">
                            <Chip
                              color="primary"
                              variant="shadow"
                              startContent={<ArrowDown10 size={20} />}
                            >{tag.sort}</Chip>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="px-1 py-2 select-none">
                              <div className="text-small font-bold">排序</div>
                              <div className="text-tiny">规则为从高到低</div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </CardFooter>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setTagEditData(tag)
                        setTagEdit(true)
                      }}
                    >编辑</ContextMenuItem>
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setTag(tag)
                        setIsOpen(true)
                      }}
                    >删除</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
            : error ?
              <DefaultTag/>
              : <p>加载中...</p>
        }
      </div>
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要删掉？</ModalHeader>
          <ModalBody>
            <p>标签名称：{tag.name}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => {
                setTag({} as TagType)
                setIsOpen(false)
              }}
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => deleteTag()}
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}