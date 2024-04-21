'use client'

import { Card, CardHeader, Button } from '@nextui-org/react'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card shadow="sm">
        <CardHeader className="flex items-center space-x-2">
          <Button
            size="sm"
            color="primary"
            variant={pathname === '/admin/settings/preferences' ? 'bordered': 'light'}
            onClick={() => router.push('/admin/settings/preferences')}
          >
            首选项
          </Button>
          <Button
            size="sm"
            color="primary"
            variant={pathname === '/admin/settings/storages' ? 'bordered': 'light'}
            onClick={() => router.push('/admin/settings/storages')}
          >
            存储
          </Button>
          <Button
            size="sm"
            color="primary"
            variant={pathname === '/admin/settings/backup' ? 'bordered': 'light'}
            onClick={() => router.push('/admin/settings/backup')}
          >
            备份
          </Button>
          <Button
            size="sm"
            color="primary"
            variant={pathname === '/admin/settings/about' ? 'bordered': 'light'}
            onClick={() => router.push('/admin/settings/about')}
          >
            关于
          </Button>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}
