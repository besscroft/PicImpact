'use client'

import * as React from 'react'
import Map, { Marker, Popup, NavigationControl, ScaleControl, GeolocateControl, FullscreenControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from 'next-themes'
import type { ImageType } from '~/types'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { ExternalLink, X } from 'lucide-react'

interface MapViewProps {
  images: ImageType[]
}

export function MapView({ images }: MapViewProps) {
  const { resolvedTheme } = useTheme()
  const [popupInfo, setPopupInfo] = React.useState<ImageType | null>(null)

  // 过滤无效坐标并转换类型
  const validImages = React.useMemo(() => {
    return images.filter(img => {
      const lat = parseFloat(img.lat || '')
      const lon = parseFloat(img.lon || '')
      return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    })
  }, [images])

  // 根据主题切换地图样式
  const mapStyle = React.useMemo(() => {
    return resolvedTheme === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  }, [resolvedTheme])

  return (
    <div className="w-full h-full relative">
      <style jsx global>{`
        .map-popup .maplibregl-popup-content {
          padding: 0 !important;
          background: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .map-popup .maplibregl-popup-tip {
          border-bottom-color: var(--card) !important;
          border-top-color: var(--card) !important;
          border-left-color: var(--card) !important;
          border-right-color: var(--card) !important;
        }
        /* 针对移动端或某些情况下的关闭按钮残留 */
        .map-popup .maplibregl-popup-close-button {
          display: none !important;
        }
      `}</style>
      <Map
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={true}
      >
        <GeolocateControl position="top-left" />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />

        {validImages.map((image) => {
          const lat = parseFloat(image.lat!)
          const lon = parseFloat(image.lon!)
          
          return (
            <Marker
              key={image.id}
              longitude={lon}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                // 阻止事件冒泡，避免点击 Marker 时地图同时也响应
                e.originalEvent.stopPropagation()
                setPopupInfo(image)
              }}
            >
              <div 
                className="group relative cursor-pointer transform transition-all duration-300 hover:scale-110 hover:z-10"
                title={image.title || 'View Photo'}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg dark:border-gray-800 dark:bg-gray-800">
                  <Image
                    src={image.preview_url || image.url || ''}
                    alt={image.title || 'Photo'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                {/* 箭头装饰 */}
                <div className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800"></div>
              </div>
            </Marker>
          )
        })}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={parseFloat(popupInfo.lon!)}
            latitude={parseFloat(popupInfo.lat!)}
            onClose={() => setPopupInfo(null)}
            closeButton={false} // 使用自定义关闭按钮
            className="map-popup"
            maxWidth="300px"
          >
            <Card className="w-64 overflow-hidden border border-border bg-card shadow-xl">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                 <Image
                  src={popupInfo.preview_url || popupInfo.url || ''}
                  alt={popupInfo.title || 'Photo'}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPopupInfo(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold truncate text-sm mb-1">{popupInfo.title || 'Untitled'}</h3>
                {popupInfo.exif && typeof popupInfo.exif === 'object' && (
                   <p className="text-xs text-muted-foreground truncate">
                     {/* @ts-ignore */}
                     {popupInfo.exif.model || 'Unknown Camera'}
                   </p>
                )}
                <div className="mt-3 flex justify-end">
                   <Link href={`/preview/${popupInfo.id}`} passHref>
                     <Button size="sm" variant="outline" className="h-7 text-xs">
                       查看详情 <ExternalLink className="ml-1 h-3 w-3" />
                     </Button>
                   </Link>
                </div>
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>
    </div>
  )
}
