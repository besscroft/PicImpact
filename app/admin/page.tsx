import { Button, Card, CardBody } from '@nextui-org/react'
import Link from 'next/link'
import { Star, MessageSquareHeart } from 'lucide-react'
import { fetchImagesAnalysis } from '~/server/lib/query'
import TagTable from '~/components/admin/dashboard/TagTable'
import { DataProps } from '~/types'

export default async function Admin() {
  const getData = async (): Promise<{
    total: number
    showTotal: number
    result: any[]
  }> => {
    'use server'
    // @ts-ignore
    return await fetchImagesAnalysis()
  }

  const data = await getData()

  const props: DataProps = {
    data: data,
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-4">
      <TagTable {...props} />
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col space-y-2">
          <span className="flex items-center">
          <span className="pr-6">如果您觉得项目不错</span>
          <span className="h-px flex-1 bg-black"></span>
        </span>
          <Link href="https://github.com/besscroft/PicImpact" target="_blank">
            <Button startContent={<Star size={20} />} variant="bordered" size="sm">Star</Button>
          </Link>
          <span className="flex items-center">
          <span className="pr-6">如果您有 Bug 反馈和建议</span>
          <span className="h-px flex-1 bg-black"></span>
        </span>
          <Link href="https://github.com/besscroft/kamera/issues/new" target="_blank">
            <Button startContent={<MessageSquareHeart size={20} />} variant="bordered" size="sm">反馈 | 建议</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  )
}