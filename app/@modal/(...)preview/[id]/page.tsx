import { Modal } from './modal.tsx'
import PreView from '~/app/(default)/preview/[...id]/page'

export default async function Page({params}: { params: any }) {
  return (
    <Modal>
      <PreView params={params} />
    </Modal>
  )
}