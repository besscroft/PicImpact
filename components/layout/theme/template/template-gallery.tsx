'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { Config, ImageType } from '~/types'

/**
 * 这个是相册页面模板，需要写新主题时直接复制一份，然后开写！
 * @param props 组件参数
 */
export default function TemplateGallery(props : Readonly<ImageHandleProps>) {
  // 总数
  const { data: pageTotal } = useSwrPageTotalHook(props)
  // data->数据; isLoading->状态; size->页码; setSize->设置页码;
  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      // Template gallery doesn't use camera/lens filters by default
      return props.handle(index + 1, props.album, undefined, undefined)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  // config 配置信息
  const { data: configData } = useSwrHydrated<Config[]>({
    handle: props.configHandle ?? (async () => [] as Config[]),
    args: 'system-config',
  })
  // 处理好的数据，直接用这个即可
  const dataList: ImageType[] = data?.flat() ?? []
  // i18n
  const t = useTranslations()

  return (
    <>
    </>
  )
}
