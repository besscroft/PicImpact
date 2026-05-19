import { TableCell, TableRow } from '~/components/ui/table.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { BadgeCheckIcon, BadgeXIcon } from 'lucide-react'

type Row = { key: string; value: string | boolean | number | null | undefined }

// Renders a typed config object (flat, camelCase) as a key/value table. The
// `data` prop accepts the new camelCase shapes returned by
// `/api/v1/settings/{s3,r2}-info` and `/api/v1/storage/open-list/info`.
export default function TabsTableCell(props: Readonly<{ data: Record<string, string | boolean | number | null | undefined> }>) {
  const { data } = props
  const rows: Row[] = Object.entries(data).map(([key, value]) => ({ key, value }))
  return (
    <>
      {rows.map((item) => (
        <TableRow key={item.key}>
          <TableCell className="font-medium">{item.key}</TableCell>
          <TableCell className="truncate max-w-48">
            {item.value === true ? (
              <Badge variant="secondary" className="bg-success text-success-foreground">
                <BadgeCheckIcon />
                true
              </Badge>
            ) : item.value === false ? (
              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                <BadgeXIcon />
                false
              </Badge>
            ) : item.value === null || item.value === undefined || item.value === '' ? (
              <Badge variant="outline">N&A</Badge>
            ) : (
              <Badge variant="secondary">{String(item.value)}</Badge>
            )}
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
