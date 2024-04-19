'use client'

import React, { useState } from 'react'
import { ImageServerHandleProps, ImageType, TagType } from '~/types'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
import { useSWRPageTotalServerHook } from '~/hooks/useSWRPageTotalServerHook'
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
  Select,
  SelectItem,
} from '@nextui-org/react'
import { ArrowDown10 } from 'lucide-react'
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
import { fetcher } from '~/utils/fetcher'
import useSWR from 'swr'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [tagArray, setTagArray] = useState(new Set([] as string[]))
  const [tag, setTag] = useState('')
  const { data, isLoading, error, mutate } = useSWRInfiniteServerHook(props, pageNum, tag)
  const { data: total, mutate: totalMutate } = useSWRPageTotalServerHook(props, tag)
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState({} as ImageType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { setImageEdit, setImageEditData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )
  const { data: tags, isLoading: tagsLoading } = useSWR('/api/v1/get-tags', fetcher)

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
      <Card shadow="sm">
        <CardHeader className="justify-between space-x-2">
          <div className="flex items-center justify-center w-full sm:w-64 md:w-80">
            <Select
              label="标签"
              placeholder="请选择标签"
              className="min-w-xs"
              isLoading={tagsLoading}
              selectedKeys={tagArray}
              onSelectionChange={async (keys: any) => {
                const updatedSet = new Set([] as string[]);
                updatedSet.add(keys?.currentKey);
                setTagArray(updatedSet)
                setTag(keys?.currentKey)
                await totalMutate()
                await mutate()
              }}
            >
              <SelectItem key="all" value="all">
                全部
              </SelectItem>
              <SelectItem key="/" value="/">
                首页
              </SelectItem>
              {tags?.map((tag: TagType) => (
                <SelectItem key={tag.tag_value} value={tag.tag_value}>
                  {tag.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              color="primary"
              radius="full"
              size="sm"
              variant="shadow"
              isLoading={isLoading}
              onClick={async () => {
                await totalMutate()
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
                    <Card shadow="sm" className="h-64">
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
                              startContent={<ArrowDown10 size={20} />}
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
        isDisabled={!total || total === 0}
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
      <ImageEditSheet {...{...props, pageNum, tag}} />
      <ImageView />
    </div>
  )
}