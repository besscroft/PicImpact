'use client'

import AListTabs from '~/components/admin/settings/storages/AListTabs'
import S3Tabs from '~/components/admin/settings/storages/S3Tabs'
import R2Tabs from '~/components/admin/settings/storages/R2Tabs'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/ui/tabs'

export default function Storages() {

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Tabs defaultValue="s3">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="s3">S3 API</TabsTrigger>
          <TabsTrigger value="r2">Cloudflare R2</TabsTrigger>
          <TabsTrigger value="alist">AList API</TabsTrigger>
        </TabsList>
        <TabsContent value="s3">
          <S3Tabs />
        </TabsContent>
        <TabsContent value="r2">
          <R2Tabs />
        </TabsContent>
        <TabsContent value="alist">
          <AListTabs />
        </TabsContent>
      </Tabs>
    </div>
  )
}