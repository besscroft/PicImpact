import { fetchAlbumsShow } from '~/server/db/query/albums'
import { Card, CardContent } from '~/components/ui/card'
import { Images, FolderOpen, HardDrive } from 'lucide-react'

export default async function Admin() {
  const albums = await fetchAlbumsShow()

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your gallery</p>
      </div>

      {/* Key metrics — 3 cards in a row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{albums?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Albums</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Images className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">—</p>
              <p className="text-sm text-muted-foreground">Photos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <HardDrive className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">—</p>
              <p className="text-sm text-muted-foreground">Storage</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Album list preview */}
      {albums && albums.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-medium">Albums</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album: any) => (
              <Card key={album.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <p className="font-medium">{album.name}</p>
                  <p className="text-sm text-muted-foreground">{album.album_value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
