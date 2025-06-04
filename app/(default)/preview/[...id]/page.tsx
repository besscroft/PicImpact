import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { PreviewImageHandleProps } from '~/types/props'
import PreviewImage from '~/components/album/preview-image'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

export default async function Label({params}: { params: any }) {
  const { id } = await params

  const getData = async (id: string) => {
    'use server'
    return await fetchImageByIdAndAuth(String(id))
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable'
    ])
  }

  const imageData = await getData(id)

  const props: PreviewImageHandleProps = {
    data: imageData,
    args: 'getImages-client-preview',
    id: id,
    configHandle: getConfig,
  }

  return (
    <PreviewImage {...props} />
  )
}