import { Card, CardBody } from '@nextui-org/card'
import { Button, Chip } from '@nextui-org/react'
import Link from 'next/link'
import { Star, MessageSquareHeart } from 'lucide-react'
import { fetchImagesAnalysis } from '~/server/lib/query'
import { ScrollArea } from '~/components/ui/ScrollArea'

export default async function Admin() {
  const getData = async () => {
    'use server'
    return await fetchImagesAnalysis()
  }

  const data = await getData() as {
    total: number
    showTotal: number
    result: any[]
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-4">
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col p2 space-y-4">
          <span className="font-light">照片数据</span>
          <span className="text-xl font-semibold">{data.total || 0}张</span>
          <span className="font-light">显示照片</span>
          <span className="text-xl font-semibold">{data.showTotal || 0}张</span>
        </CardBody>
      </Card>
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col space-y-2">
          <span className="font-light">分类数据</span>
          <ScrollArea className="space-y-2 p-2">
            {data.result ? data.result.map((item: any) => (
                <>
                  <div key={item?.tag} className="space-x-2">
                    <Chip radius="sm" variant="dot">{item?.tag}</Chip>
                    <span className="text-lg font-semibold">{item?._count.tag} 张</span>
                  </div>
                </>
              ))
              :
              <span> 暂无分类数据 </span>
            }
          </ScrollArea>
        </CardBody>
      </Card>
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col space-y-2">
          <span className="flex items-center">
          <span className="pr-6">如果您觉得项目不错</span>
          <span className="h-px flex-1 bg-black"></span>
        </span>
          <Link href="https://github.com/besscroft/PicImpact" target="_blank">
            <Button startContent={<Star size={20} />} variant="bordered">Star</Button>
          </Link>
          <span className="flex items-center">
          <span className="pr-6">如果您有 Bug 反馈和建议</span>
          <span className="h-px flex-1 bg-black"></span>
        </span>
          <Link href="https://github.com/besscroft/kamera/issues/new" target="_blank">
            <Button startContent={<MessageSquareHeart size={20} />} variant="bordered">反馈 | 建议</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  )
}