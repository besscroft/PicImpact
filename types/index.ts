import { SVGProps } from 'react'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type HandleProps = {
  handle: () => any
  args: string
}

export type TagType = {
  id: number;
  name: string;
  tag_value: string;
  detail: string;
  show: number;
  sort: number;
}