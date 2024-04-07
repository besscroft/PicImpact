import VaulDrawer from '~/components/VaulDrawer'
import { DropMenu } from '~/components/DropMenu'

export default async function DynamicNavbar() {
  return (
    <>
      <div className="flex sm:hidden">
        <VaulDrawer/>
      </div>
      <div className="hidden sm:flex space-x-2">
        <DropMenu/>
      </div>
    </>
  )
}