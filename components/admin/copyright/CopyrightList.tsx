'use client'

import React, { useState } from 'react'
import { HandleProps, CopyrightType } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner, Switch
} from '@nextui-org/react'
import { Eye, EyeOff, Pencil, Trash } from 'lucide-react'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function CopyrightList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [isOpen, setIsOpen] = useState(false)
  const [copyright, setCopyright] = useState({} as CopyrightType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateCopyrightLoading, setUpdateCopyrightLoading] = useState(false)
  const [updateCopyrightId, setUpdateCopyrightId] = useState(0)
  const { setCopyrightEdit, setCopyrightEditData } = useButtonStore(
    (state) => state,
  )

  async function deleteCopyright() {
    setDeleteLoading(true)
    if (!copyright.id) return
    try {
      const res = await fetch(`/api/v1/copyright-delete/${copyright.id}`, {
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

  async function updateCopyrightShow(id: number, show: number) {
    try {
      setUpdateCopyrightId(id)
      setUpdateCopyrightLoading(true)
      const res = await fetch(`/api/v1/update-copyright-show`, {
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
      setUpdateCopyrightId(0)
      setUpdateCopyrightLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data && data.map((copyright: CopyrightType) => (
          <motion.div
            key={copyright.id}
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
                <p>{copyright.name}</p>
                <Popover placement="top" shadow="sm">
                  <PopoverTrigger className="cursor-pointer">
                    <Chip className="select-none" color="success" variant="shadow" aria-label="类型">{copyright.type === 'social' ? '社交媒体' : '外链'}</Chip>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2 select-none">
                      <div className="text-small font-bold">类型</div>
                      <div className="text-tiny">版权声明类型</div>
                    </div>
                  </PopoverContent>
                </Popover>
              </CardHeader>
              <CardBody>
                <p>{copyright.detail || 'N&A'}</p>
              </CardBody>
              <CardFooter className="flex space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                <div className="flex flex-1 space-x-1 items-center">
                  {updateCopyrightLoading && updateCopyrightId === copyright.id ? <Spinner size="sm" /> :
                    <Switch
                      defaultSelected
                      size="sm"
                      color="success"
                      isSelected={copyright.show === 0}
                      isDisabled={updateCopyrightLoading}
                      thumbIcon={({ isSelected }) =>
                        isSelected ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )
                      }
                      onValueChange={(isSelected: boolean) => updateCopyrightShow(copyright.id, isSelected ? 0 : 1)}
                    />
                  }
                </div>
                <div className="space-x-1">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setCopyrightEditData(copyright)
                      setCopyrightEdit(true)
                    }}
                    aria-label="编辑版权"
                  >
                    <Pencil size={20} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setCopyright(copyright)
                      setIsOpen(true)
                    }}
                    aria-label="删除版权"
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
            <p>版权 ID：{copyright.id}</p>
            <p>版权名称：{copyright.name}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => {
                setCopyright({} as CopyrightType)
                setIsOpen(false)
              }}
              aria-label="不删除"
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => deleteCopyright()}
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