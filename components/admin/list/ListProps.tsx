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
  Image,
  Switch,
  Badge
} from '@nextui-org/react'
import { ArrowDown10, Pencil, Trash, Eye, EyeOff, ScanSearch } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import ImageEditSheet from '~/components/admin/list/ImageEditSheet'
import ImageView from '~/components/admin/list/ImageView'
import { fetcher } from '~/utils/fetcher'
import useSWR from 'swr'
import { motion } from 'framer-motion'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [tagArray, setTagArray] = useState(new Set([] as string[]))
  const [tag, setTag] = useState('')
  const { data, isLoading, mutate } = useSWRInfiniteServerHook(props, pageNum, tag)
  const { data: total, mutate: totalMutate } = useSWRPageTotalServerHook(props, tag)
  const [isOpen, setIsOpen] = useState(false)
  const [image, setImage] = useState({} as ImageType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
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
      }).then(res => res.json())
      if (res?.code === 200) {
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

  async function updateImageShow(id: number, show: number) {
    try {
      setUpdateShowLoading(true)
      const res = await fetch(`/api/v1/update-image-show`, {
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
      setUpdateShowLoading(false)
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
              size="sm"
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
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01]
            }}
          >
            <Card shadow="sm" className="h-72">
              <CardHeader className="justify-between space-x-1 select-none">
                {
                  image.tag_values.includes(',') ?
                    <Badge content={image.tag_values.split(",").length} color="primary">
                      <Popover placement="top" shadow="sm">
                        <PopoverTrigger className="cursor-pointer">
                          <Chip variant="shadow" className="flex-1">{image.tag_names.length > 8 ? image.tag_names.substring(0, 8) + '...' : image.tag_names}</Chip>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-2 select-none">
                            <div className="text-small font-bold">标签</div>
                            <div className="text-tiny">图片标签，在对应的路由上显示</div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Badge>
                    :
                    <Popover placement="top" shadow="sm">
                      <PopoverTrigger className="cursor-pointer">
                        <Chip variant="shadow" className="flex-1">{image.tag_names}</Chip>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2 select-none">
                          <div className="text-small font-bold">标签</div>
                          <div className="text-tiny">图片标签，在对应的路由上显示</div>
                        </div>
                      </PopoverContent>
                    </Popover>
                }
                <div className="flex items-center">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setImageViewData(image)
                      setImageView(true)
                    }}
                  >
                    <ScanSearch size={20} />
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <Image
                  className="aspect-video"
                  isBlurred
                  isZoomed
                  height={140}
                  src={image.url}
                  alt={image.detail}
                />
              </CardBody>
              <CardFooter
                className="flex space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                <div className="flex flex-1 space-x-1 items-center">
                  <Switch
                    defaultSelected
                    size="sm"
                    color="success"
                    isSelected={image.show === 0}
                    isDisabled={updateShowLoading}
                    thumbIcon={({ isSelected }) =>
                      isSelected ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )
                    }
                    onValueChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                  <Popover placement="top" shadow="sm">
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
                </div>
                <div className="space-x-1">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setImageEditData(image)
                      setImageEdit(true)
                    }}
                  >
                    <Pencil size={20} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setImage(image)
                      setIsOpen(true)
                    }}
                  >
                    <Trash size={20} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
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