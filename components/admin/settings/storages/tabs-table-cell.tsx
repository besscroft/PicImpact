import { TableCell, TableRow } from '~/components/ui/table.tsx'
import { Badge } from '~/components/ui/badge.tsx'
import { BadgeCheckIcon, BadgeXIcon } from 'lucide-react'

export default function TabsTableCell(props : Readonly<any>) {
  const { data } = props
  return (
    <>
      {data.map((item: any) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.config_key}</TableCell>
          <TableCell className="truncate max-w-48">{item.config_value ?
            item.config_value === 'true' ?
              <Badge
                variant="secondary"
                className="bg-green-500 text-white dark:bg-green-600"
              >
                <BadgeCheckIcon />
                true
              </Badge>
              : item.config_value === 'false' ?
                <Badge
                  variant="secondary"
                  className="bg-yellow-500 text-white dark:bg-yellow-600"
                >
                  <BadgeXIcon />
                  false
                </Badge>
                :
                <Badge variant="secondary">{item.config_value}</Badge>
            : <Badge variant="outline">N&A</Badge>}</TableCell>
        </TableRow>
      ))}
    </>
  )
}