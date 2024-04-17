import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/react'
import Link from 'next/link'
import { Star, MessageSquareHeart } from 'lucide-react'

export default async function Admin() {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-4">
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col p2 space-y-4">
          <span className="font-light">照片数据</span>
          <span className="text-xl font-semibold">10张</span>
          <span className="font-light">显示照片</span>
          <span className="text-xl font-semibold">1张</span>
        </CardBody>
      </Card>
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-4">
            <span className="font-light">首页精选</span>
            <span className="text-xl font-semibold">3 张</span>
          </div>
          <div className="flex flex-col space-y-4">
            <span className="font-light">首页精选</span>
            <span className="text-xl font-semibold">3 张</span>
          </div>
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