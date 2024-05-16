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
  Button,
  Switch,
  Spinner
} from '@nextui-org/react'
import { ArrowDown10, Eye, EyeOff, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import DefaultTag from '~/components/admin/tag/DefaultTag'
import { TagType } from '~/types'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { motion } from 'framer-motion'

export default function TagList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [isOpen, setIsOpen] = useState(false)
  const [tag, setTag] = useState({} as TagType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateTagLoading, setUpdateTagLoading] = useState(false)
  const [updateTagId, setUpdateTagId] = useState(0)
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

  async function updateTagShow(id: number, show: number) {
    try {
      setUpdateTagId(id)
      setUpdateTagLoading(true)
      const res = await fetch(`/api/v1/update-tag-show`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          show
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateTagId(0)
      setUpdateTagLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <DefaultTag/>
        {data && data.map((tag: TagType) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01]
            }}
          >
            <Card shadow="sm" isFooterBlurred className="h-64">
              <CardHeader className="flex gap-3">
                <p>{tag.name}</p>
                <Popover placement="top" shadow="sm">
                  <PopoverTrigger className="cursor-pointer">
                    <Chip className="select-none" color="success" variant="shadow" aria-label="路由">{tag.tag_value}</Chip>
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
              <CardFooter className="flex space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                <div className="flex flex-1 space-x-1 items-center">
                  {updateTagLoading && updateTagId === tag.id ? <Spinner size="sm" /> :
                    <Switch
                      defaultSelected
                      size="sm"
                      color="success"
                      isSelected={tag.show === 0}
                      isDisabled={updateTagLoading}
                      thumbIcon={({ isSelected }) =>
                        isSelected ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )
                      }
                      onValueChange={(isSelected: boolean) => updateTagShow(tag.id, isSelected ? 0 : 1)}
                    />
                  }
                  <Popover placement="top" shadow="sm">
                    <PopoverTrigger className="cursor-pointer">
                      <Chip
                        color="primary"
                        variant="shadow"
                        startContent={<ArrowDown10 size={20} />}
                        aria-label="排序"
                      >{tag.sort}</Chip>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="px-1 py-2 select-none">
                        <div className="text-small font-bold">排序</div>
                        <div className="text-tiny">规则为从高到低</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-x-1">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setTagEditData(tag)
                      setTagEdit(true)
                    }}
                    aria-label="编辑标签"
                  >
                    <Pencil size={20} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setTag(tag)
                      setIsOpen(true)
                    }}
                    aria-label="删除标签"
                  >
                    <Trash size={20} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要删掉？</ModalHeader>
          <ModalBody>
            <p>标签 ID：{tag.id}</p>
            <p>标签名称：{tag.name}</p>
            <p>标签路由：{tag.tag_value}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => {
                setTag({} as TagType)
                setIsOpen(false)
              }}
              aria-label="不删除"
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => deleteTag()}
              aria-label="确认删除"
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}