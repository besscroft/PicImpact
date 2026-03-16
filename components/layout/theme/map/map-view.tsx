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
import { ExternalLink, X, Camera, ImageIcon } from 'lucide-react'
import Supercluster from 'supercluster'
import type { BBox } from 'geojson'
import { useTranslations } from 'next-intl'

interface MapViewProps {
  images: ImageType[]
}

interface ImagePointProperties {
  imageId: string
  image: ImageType
}

export function MapView({ images }: MapViewProps) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations()
  const [popupInfo, setPopupInfo] = React.useState<ImageType | null>(null)
  const mapRef = React.useRef<any>(null)
  const [zoom, setZoom] = React.useState(1.5)
  const [bounds, setBounds] = React.useState<BBox>([-180, -85, 180, 85])

  const validImages = React.useMemo(() => {
    return images.filter(img => {
      const lat = parseFloat(img.lat || '')
      const lon = parseFloat(img.lon || '')
      return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    })
  }, [images])

  const points = React.useMemo(() => {
    return validImages.map((img): Supercluster.PointFeature<ImagePointProperties> => ({
      type: 'Feature',
      properties: {
        imageId: img.id,
        image: img,
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(img.lon!), parseFloat(img.lat!)],
      },
    }))
  }, [validImages])

  const clusterIndex = React.useMemo(() => {
    const sc = new Supercluster<ImagePointProperties>({
      radius: 60,
      maxZoom: 16,
    })
    sc.load(points)
    return sc
  }, [points])

  const clusters = React.useMemo(() => {
    return clusterIndex.getClusters(bounds, Math.floor(zoom))
  }, [clusterIndex, bounds, zoom])

  const mapStyle = React.useMemo(() => {
    return resolvedTheme === 'dark'
      ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  }, [resolvedTheme])

  const syncMapState = React.useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    setZoom(map.getZoom())
  }, [])

  const getClusterSize = (count: number): number => {
    if (count < 10) return 36
    if (count < 50) return 42
    if (count < 100) return 48
    return 54
  }

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
          display: none !important;
        }
        .map-popup .maplibregl-popup-close-button {
          display: none !important;
        }
      `}</style>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 121,
          latitude: 31,
          zoom: 1.5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        attributionControl={true}
        onMove={syncMapState}
        onLoad={syncMapState}
      >
        <GeolocateControl position="top-left" />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />
        <ScaleControl />

        {clusters.map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates
          const props = feature.properties

          if ('cluster' in props && props.cluster) {
            const { cluster_id, point_count } = props
            const size = getClusterSize(point_count)

            return (
              <Marker
                key={`cluster-${cluster_id}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  const expansionZoom = Math.min(
                    clusterIndex.getClusterExpansionZoom(cluster_id),
                    20
                  )
                  mapRef.current?.flyTo({
                    center: [longitude, latitude],
                    zoom: expansionZoom,
                    duration: 500,
                  })
                }}
              >
                <div className="relative cursor-pointer group" role="img" aria-label={`Cluster of ${point_count} photos`}>
                  <div
                    className="absolute rounded-full bg-primary/15 dark:bg-primary/25 transition-all duration-300 group-hover:bg-primary/25 dark:group-hover:bg-primary/35"
                    style={{
                      width: size + 12,
                      height: size + 12,
                      top: -6,
                      left: -6,
                    }}
                  />
                  <div
                    className="relative flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 group-hover:scale-105"
                    style={{ width: size, height: size }}
                  >
                    <div className="flex flex-col items-center leading-none gap-0.5">
                      <span className="text-sm font-bold">{point_count}</span>
                      <ImageIcon className="h-3 w-3 opacity-70" />
                    </div>
                  </div>
                </div>
              </Marker>
            )
          }

          const { image } = props as ImagePointProperties

          return (
            <Marker
              key={`point-${image.id}`}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                setPopupInfo(image)
              }}
            >
              <div
                className="group relative cursor-pointer transform transition-all duration-300 hover:scale-110 hover:z-10"
                role="img"
                aria-label={image.title || 'Photo marker'}
                title={image.title || 'View Photo'}
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-background shadow-lg">
                  <Image
                    src={image.preview_url || image.url || ''}
                    alt={image.title || 'Photo'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-background bg-background"></div>
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
            closeButton={false}
            className="map-popup"
            maxWidth="320px"
            offset={8}
          >
            <Card className="w-72 overflow-hidden border-0 bg-card shadow-2xl rounded-xl">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={popupInfo.preview_url || popupInfo.url || ''}
                  alt={popupInfo.title || 'Photo'}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/5 to-transparent" />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="absolute right-2 top-2 h-7 w-7 rounded-full bg-overlay text-foreground hover:bg-foreground/20 backdrop-blur-sm z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPopupInfo(null)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-card-foreground text-sm truncate drop-shadow-md">
                    {popupInfo.title || 'Untitled'}
                  </h3>
                </div>
              </div>
              <CardContent className="p-3 space-y-2.5">
                {popupInfo.exif && typeof popupInfo.exif === 'object' && (popupInfo.exif.make || popupInfo.exif.model) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Camera className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {/* @ts-ignore */}
                      {[popupInfo.exif.make, popupInfo.exif.model].filter(Boolean).join(' ')}
                    </span>
                  </div>
                )}
                {popupInfo.exif && typeof popupInfo.exif === 'object' &&
                  (popupInfo.exif.f_number || popupInfo.exif.exposure_time || popupInfo.exif.iso_speed_rating || popupInfo.exif.focal_length) && (
                  <div className="flex flex-wrap gap-1">
                    {popupInfo.exif.f_number && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {popupInfo.exif.f_number}
                      </span>
                    )}
                    {popupInfo.exif.exposure_time && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {popupInfo.exif.exposure_time}
                      </span>
                    )}
                    {popupInfo.exif.iso_speed_rating && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        ISO {popupInfo.exif.iso_speed_rating}
                      </span>
                    )}
                    {popupInfo.exif.focal_length && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {popupInfo.exif.focal_length}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-end">
                  <Link href={`/preview/${popupInfo.id}`} passHref>
                    <Button size="sm" className="h-8 text-xs gap-1.5 rounded-lg">
                      {t('Button.viewDetails', { defaultValue: 'View details' })} <ExternalLink className="h-3 w-3" />
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
