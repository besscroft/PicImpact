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
  Badge,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react'
import { ArrowDown10, Pencil, Trash, Eye, EyeOff, ScanSearch, CircleHelp, CircleEllipsis, Images } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import ImageEditSheet from '~/components/admin/list/ImageEditSheet'
import ImageView from '~/components/admin/list/ImageView'
import { fetcher } from '~/utils/fetcher'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import ImageHelpSheet from '~/components/admin/list/ImageHelpSheet'
import { Select as AntdSelect } from 'antd'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [tagArray, setTagArray] = useState(new Set([] as string[]))
  const [tag, setTag] = useState('')
  const [imageTag, setImageTag] = useState('')
  const [imageDefaultTag, setImageDefaultTag] = useState({})
  const { data, isLoading, mutate } = useSWRInfiniteServerHook(props, pageNum, tag)
  const { data: total, mutate: totalMutate } = useSWRPageTotalServerHook(props, tag)
  const [isOpen, setIsOpen] = useState(false)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [image, setImage] = useState({} as ImageType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateImageTagLoading, setUpdateImageTagLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState(0)
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageHelp } = useButtonStore(
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
      setUpdateShowId(id)
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
      setUpdateShowId(0)
      setUpdateShowLoading(false)
    }
  }

  async function updateImageTag() {
    if (!imageTag) {
      toast.error('图片绑定的相册不能为空！')
      return
    }
    try {
      setUpdateImageTagLoading(true)
      const res = await fetch(`/api/v1/update-image-tag`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: image.id,
          tagId: Number(imageTag)
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        setImageTag('')
        setImageDefaultTag({})
        setImage({} as ImageType)
        setIsTypeOpen(false)
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateImageTagLoading(false)
    }
  }

  const fieldNames = { label: 'name', value: 'id' }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card shadow="sm">
        <CardHeader className="justify-between space-x-2">
          <div className="flex items-center justify-center w-full sm:w-64 md:w-80">
            <Select
              label="相册"
              placeholder="请选择相册"
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
              isIconOnly
              size="sm"
              color="warning"
              aria-label="帮助"
              onClick={() => setImageHelp(true)}
            >
              <CircleHelp />
            </Button>
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
              aria-label="刷新"
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
                          <Chip variant="shadow" className="flex-1" aria-label="相册">{image.tag_names.length > 8 ? image.tag_names.substring(0, 8) + '...' : image.tag_names}</Chip>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-1 py-2 select-none">
                            <div className="text-small font-bold">相册</div>
                            <div className="text-tiny">图片在对应的相册上显示</div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </Badge>
                    :
                    <Popover placement="top" shadow="sm">
                      <PopoverTrigger className="cursor-pointer">
                        <Chip variant="shadow" className="flex-1" aria-label="相册">{image.tag_names}</Chip>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2 select-none">
                          <div className="text-small font-bold">相册</div>
                          <div className="text-tiny">图片在对应的相册上显示</div>
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
                    aria-label="查看图片"
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
                  src={image.preview_url || image.url}
                  alt={image.detail}
                />
              </CardBody>
              <CardFooter
                className="flex space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
                <div className="flex flex-1 space-x-1 items-center">
                  {updateShowLoading && updateShowId === image.id ? <Spinner size="sm" /> :
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
                  }
                  <Popover placement="top" shadow="sm">
                    <PopoverTrigger className="cursor-pointer">
                      <Chip
                        color="primary"
                        variant="shadow"
                        startContent={<ArrowDown10 size={20} />}
                        aria-label="排序"
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
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        size="sm"
                        aria-label="更多操作"
                      >
                        <CircleEllipsis size={20} />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                      <DropdownItem
                        key="bind"
                        startContent={<Images size={20} />}
                        onClick={() => {
                          setImage(image)
                          setImageDefaultTag({ label: image.tag_names, value: image.tag_values })
                          setIsTypeOpen(true)
                        }}
                      >
                        绑定相册
                      </DropdownItem>
                      <DropdownItem
                        key="edit"
                        startContent={<Pencil size={20} />}
                        onClick={() => {
                          setImageEditData(image)
                          setImageEdit(true)
                        }}
                      >编辑图片</DropdownItem>
                      <DropdownItem
                        key="delete"
                        className="text-danger"
                        color="danger"
                        startContent={<Trash size={20} />}
                        onClick={() => {
                          setImage(image)
                          setIsOpen(true)
                        }}
                      >
                        删除图片
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
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
            <p>图片 ID：{image.id}</p>
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
              aria-label="不删除"
            >
              算了
            </Button>
            <Button
              color="primary"
              isLoading={deleteLoading}
              onClick={() => deleteImage()}
              aria-label="确认删除"
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isTypeOpen}
        isDismissable={false}
        placement="center"
        onClose={() => setIsTypeOpen(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">相册绑定</ModalHeader>
          <ModalBody>
            <AntdSelect
              defaultValue={imageDefaultTag}
              loading={isLoading}
              options={tags}
              fieldNames={fieldNames}
              onChange={(value) => {
                // @ts-ignore
                setImageTag(value)
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="bordered"
              isLoading={updateImageTagLoading}
              onClick={() => updateImageTag()}
            >
              更新
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ImageEditSheet {...{...props, pageNum, tag}} />
      <ImageView />
      <ImageHelpSheet />
    </div>
  )
}