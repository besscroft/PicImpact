'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Camera, Aperture, RotateCcw } from 'lucide-react'
import { cn } from '~/lib/utils'

interface CameraLensFilterProps {
  album: string
  selectedCamera: string
  selectedLens: string
  onCameraChange: (camera: string) => void
  onLensChange: (lens: string) => void
  onReset: () => void
}

interface FilterData {
  cameras: string[]
  lenses: string[]
}

export default function CameraLensFilter({
  album,
  selectedCamera,
  selectedLens,
  onCameraChange,
  onLensChange,
  onReset,
}: CameraLensFilterProps) {
  const t = useTranslations()
  const [filterData, setFilterData] = useState<FilterData>({ cameras: [], lenses: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (album && album !== '/') {
          params.set('album', album)
        }
        const url = `/api/public/camera-lens-list${params.toString() ? `?${params.toString()}` : ''}`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setFilterData(data)
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilterData()
  }, [album])

  const hasActiveFilter = selectedCamera !== '' || selectedLens !== ''

  return (
    <div className="space-y-4">
      {/* Camera Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Camera className="h-4 w-4" />
          {t('Words.camera')}
        </Label>
        <Select
          value={selectedCamera || 'all'}
          onValueChange={(value) => onCameraChange(value === 'all' ? '' : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('Words.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Words.all')}</SelectItem>
            {filterData.cameras.map((camera) => (
              <SelectItem key={camera} value={camera}>
                {camera}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lens Select */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Aperture className="h-4 w-4" />
          {t('Words.lens')}
        </Label>
        <Select
          value={selectedLens || 'all'}
          onValueChange={(value) => onLensChange(value === 'all' ? '' : value)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('Words.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('Words.all')}</SelectItem>
            {filterData.lenses.map((lens) => (
              <SelectItem key={lens} value={lens}>
                {lens}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilter && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {selectedCamera && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
              <Camera className="h-3 w-3" />
              {selectedCamera}
            </span>
          )}
          {selectedLens && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
              <Aperture className="h-3 w-3" />
              {selectedLens}
            </span>
          )}
        </div>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'w-full',
          !hasActiveFilter && 'opacity-50'
        )}
        onClick={onReset}
        disabled={!hasActiveFilter}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        {t('Button.reset')}
      </Button>
    </div>
  )
}

