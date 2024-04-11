import { SVGProps } from 'react'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type HandleProps = {
  handle: () => any
  args: string
}