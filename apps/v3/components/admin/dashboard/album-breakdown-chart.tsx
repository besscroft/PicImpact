'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '~/components/ui/chart'
import type { AdminDashboardAlbumBreakdownItem } from '~/types/admin-dashboard'

type AlbumBreakdownChartProps = {
  data: AdminDashboardAlbumBreakdownItem[]
  totalLabel: string
  publicLabel: string
  emptyLabel: string
}

const TOTAL_BAR_COLOR = '#d7c0a2'
const PUBLIC_BAR_COLOR = '#a56526'

export function AlbumBreakdownChart({
  data,
  totalLabel,
  publicLabel,
  emptyLabel,
}: AlbumBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/60 px-4 py-6 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    shortName: item.name.length > 14 ? `${item.name.slice(0, 14)}...` : item.name,
  }))

  const chartConfig = {
    total: {
      label: totalLabel,
      color: TOTAL_BAR_COLOR,
    },
    publicCount: {
      label: publicLabel,
      color: PUBLIC_BAR_COLOR,
    },
  } satisfies ChartConfig

  const mobileList = (
    <div className="grid gap-2 md:grid-cols-3">
      {data.map((item) => (
        <div
          key={item.albumValue}
          className="rounded-[1.1rem] border border-border/70 bg-background/70 px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="line-clamp-1 text-sm font-medium text-foreground">{item.name}</p>
            <span className="text-xs text-muted-foreground">{item.total}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: TOTAL_BAR_COLOR }}
              />
              {totalLabel} {item.total}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PUBLIC_BAR_COLOR }}
              />
              {publicLabel} {item.publicCount}
            </span>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
            barGap={8}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} hide />
            <YAxis
              type="category"
              dataKey="shortName"
              tickLine={false}
              axisLine={false}
              width={110}
              tickMargin={10}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelKey="name" indicator="dot" />}
            />
            <Legend
              verticalAlign="top"
              align="left"
              content={(props) => (
                <ChartLegendContent
                  payload={props.payload}
                  verticalAlign={props.verticalAlign}
                />
              )}
            />
            <Bar
              dataKey="total"
              name={totalLabel}
              fill={TOTAL_BAR_COLOR}
              radius={999}
              maxBarSize={12}
            />
            <Bar
              dataKey="publicCount"
              name={publicLabel}
              fill={PUBLIC_BAR_COLOR}
              radius={999}
              maxBarSize={12}
            >
              <LabelList
                dataKey="publicCount"
                position="right"
                className="fill-muted-foreground text-[11px]"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      {mobileList}
    </div>
  )
}
