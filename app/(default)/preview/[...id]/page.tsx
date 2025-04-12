import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { PreviewImageHandleProps } from '~/types/props'
import PreviewImage from '~/components/album/preview-image'


export default async function Label({params}: { params: any }) {
  const { id } = await params

  const getData = async (id: string) => {
    'use server'
    return await fetchImageByIdAndAuth(String(id));
  }

  const getConfig = async () => {
    'use server'
    // 什么都不做
    console.log('')
  }

  const imageData = await getData(id)

  const props: PreviewImageHandleProps = {
    data: imageData[0],
    args: 'getImages-client-preview',
    id: id,
    configHandle: getConfig,
  }

  return (
    <PreviewImage {...props} />
  )
}