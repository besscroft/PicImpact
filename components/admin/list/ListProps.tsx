'use client'

import React, { useState } from 'react'
import { HandleListProps, ImageType } from '~/types'
import { usePageSWRHydrated } from '~/hooks/usePageSWRHydrated'
import { useTotalSWRHydrated } from '~/hooks/useTotalSWRHydrated'
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
  Pagination,
} from '@nextui-org/react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/ContextMenu'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import ImageEditSheet from '~/components/admin/list/ImageEditSheet'
import ImageView from '~/components/admin/list/ImageView'

export default function ListProps(props : Readonly<HandleListProps>) {
  const [pageNum, setPageNum] = useState(1)
  const { data, isLoading, error, mutate } = usePageSWRHydrated(props, pageNum)
  const { data: total, isLoading: totalLoading, error: totalError, mutate: totalMutate } = useTotalSWRHydrated(props)
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState({} as ImageType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { setImageEdit, setImageEditData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )

  async function deleteImage() {
    setDeleteLoading(true)
    if (!image.id) return
    try {
      const res = await fetch(`/api/v1/image-delete/${image.id}`, {
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
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600 select-none">图片维护</h4>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              color="primary"
              radius="full"
              size="sm"
              variant="shadow"
              isLoading={isLoading}
              onClick={async () => {
                await mutate()
              }}
            >
              刷新
            </Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {
          !isLoading && !error && data ?
            <>
              {data.map((image: ImageType) => (
                <ContextMenu key={image.id}>
                  <ContextMenuTrigger>
                    <Card className="h-64">
                      <CardHeader className="flex gap-3">
                        <Chip variant="shadow">{image.tag}</Chip>
                      </CardHeader>
                      <CardBody>
                        <p>{image.detail || '没有介绍'}</p>
                      </CardBody>
                      <CardFooter className="flex space-x-1 select-none">
                        {
                          image.show === 0 ?
                            <Chip color="success" variant="shadow">显示</Chip>
                            :
                            <Chip color="danger" variant="shadow">不显示</Chip>
                        }
                        <Popover placement="top">
                          <PopoverTrigger className="cursor-pointer">
                            <Chip
                              color="primary"
                              variant="shadow"
                              startContent={<CaretSortIcon/>}
                            >{image.sort}</Chip>
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
                        setImageViewData(image)
                        setImageView(true)
                      }}
                    >查看</ContextMenuItem>
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setImageEditData(image)
                        setImageEdit(true)
                      }}
                    >编辑</ContextMenuItem>
                    <ContextMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        setImage(image)
                        setIsOpen(true)
                      }}
                    >删除</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </>
            : error ?
              <p>暂无数据</p>
              : <p>加载中...</p>
        }
      </div>
      <Pagination
        className="!m-0"
        total={total}
        color="primary"
        size="sm"
        page={pageNum}
        onChange={async (page) => {
          setPageNum(page)
          await mutate()
        }}
      />
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要删掉？</ModalHeader>
          <ModalBody>
            <p>图片介绍：{image.detail || '没有介绍'}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onClick={() => {
                setImage({} as ImageType)
                setIsOpen(false)
              }}
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => deleteImage()}
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ImageEditSheet {...{...props, pageNum}} />
      <ImageView {...{...props, pageNum}} />
    </div>
  )
}