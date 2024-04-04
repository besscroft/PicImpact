import { useMediaQuery } from 'react-responsive'
import { breakpointsTailwind } from '~/constants/breakpoints'

export function useBreakpoints() {
  const smAndLarger  = useMediaQuery({ query: `(min-width: ${breakpointsTailwind.sm}px)` })
  const mdAndLarger = useMediaQuery({ query: `(min-width: ${breakpointsTailwind.md}px)` })
  const lgAndLarger = useMediaQuery({ query: `(min-width: ${breakpointsTailwind.lg}px)` })
  const xlAndLarger = useMediaQuery({ query: `(min-width: ${breakpointsTailwind.xl}px)` })
  const twoXlAndLarger = useMediaQuery({ query: `(min-width: ${breakpointsTailwind["2xl"]}px)` })

  return {
    smAndLarger,
    mdAndLarger,
    lgAndLarger,
    xlAndLarger,
    twoXlAndLarger
  }
}