'use client'

import { useMemo, useState } from 'react'
import type { HandleProps, ImageHandleProps } from '~/types/props.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { DraggableCardBody, DraggableCardContainer } from '~/components/ui/origin/draggable-card.tsx'
import type { ImageType } from '~/types'

export default function PolaroidGallery(props: Readonly<ImageHandleProps>) {
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  const customTitle = configData?.find((item: any) => item.config_key === 'custom_title')?.config_value.toString()

  const { data } = useSWRInfinite((index) => {
    return [`client-${props.args}-${index}-${props.album}`, index]
  },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    }, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  })

  const dataList = useMemo(() => data ? [].concat(...data) : [], [data])

  const randomPositions = useMemo(() => {
    return dataList.map(() => ({
      top: `${Math.floor(Math.random() * 40) + 10}%`, // 10% - 50%
      left: `${Math.floor(Math.random() * 50) + 10}%`, // 10% - 60%
      rotate: `${Math.floor(Math.random() * 20) - 10}deg`, // -10deg - 10deg
    }));
  }, [dataList]);

  const [currentMaxZIndex, setCurrentMaxZIndex] = useState(10);
  const [cardZIndices, setCardZIndices] = useState<Record<string, number>>({});

  const handleCardClick = (id: string) => {
    setCardZIndices((prev) => ({
      ...prev,
      [id]: currentMaxZIndex + 1,
    }));
    setCurrentMaxZIndex((prev) => prev + 1);
  };

  return (
    <DraggableCardContainer className="relative flex min-h-screen w-full items-center justify-center overflow-clip">
      <p className="absolute top-1/2 mx-auto max-w-sm -translate-y-3/4 text-center text-2xl font-black text-neutral-400 md:text-4xl dark:text-neutral-800">
        {customTitle || '瓦达西可不可爱'}
      </p>
      {dataList?.map((item: ImageType, index: number) => (
        <DraggableCardBody
          key={item.id}
          className="absolute"
          style={{
            top: randomPositions[index]?.top,
            left: randomPositions[index]?.left,
            rotate: randomPositions[index]?.rotate,
            zIndex: cardZIndices[item.id] || 1,
          }}
          onMouseDown={() => handleCardClick(item.id)}
        >
          <img
            src={item.preview_url}
            alt={item.title}
            className="pointer-events-none relative z-10 h-80 w-80 object-cover"
          />
          <h3 className="mt-4 text-center text-2xl font-bold text-neutral-700 dark:text-neutral-300">
            {item.title}
          </h3>
        </DraggableCardBody>
      ))}
    </DraggableCardContainer>
  )
}