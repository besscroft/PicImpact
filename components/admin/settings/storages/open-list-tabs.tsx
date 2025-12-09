'use client'

import { Card } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import OpenListEditSheet from '~/components/admin/settings/storages/open-list-edit-sheet.tsx'
import { useTranslations } from 'next-intl'
import TabsTableCell from '~/components/admin/settings/storages/tabs-table-cell'

export default function OpenListTabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/storage/open-list/info', fetcher
    , { revalidateOnFocus: false })
  const { setOpenListEdit, setOpenListEditData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  if (error) {
    toast.error(t('Config.requestFailed'))
  }

  return (
    <div className="space-y-2">
      <Card className="py-0">
        <div className="flex justify-between p-2">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">{t('Config.openListTitle')}</h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => mutate()}
              aria-label={t('Config.refresh')}
            >
              {isValidating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {t('Config.refresh')}
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setOpenListEdit(true)
                setOpenListEditData(JSON.parse(JSON.stringify(data)))
              }}
              aria-label={t('Config.edit')}
            >
              {t('Config.edit')}
            </Button>
          </div>
        </div>
      </Card>
      {
        data &&
        <Card className="p-2">
          <Table aria-label={t('Config.openListTitle')}>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TabsTableCell data={data} />
            </TableBody>
          </Table>
        </Card>
      }
      {Array.isArray(data) && data.length > 0 && <OpenListEditSheet />}
    </div>
  )
}