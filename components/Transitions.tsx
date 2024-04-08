'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next-nprogress-bar'
import {
  createContext,
  MouseEventHandler,
  PropsWithChildren,
  use,
  useTransition,
} from 'react'

export const DELAY = 200;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
const noop = () => {};

type TransitionContext = {
  pending: boolean;
  navigate: (url: string) => void;
};
const Context = createContext<TransitionContext>({
  pending: false,
  navigate: noop,
});
export const usePageTransition = () => use(Context);

type Props = PropsWithChildren<{
  className?: string;
}>;

export default function Transitions({ children, className }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const navigate = (href: string) => {
    start(async () => {
      router.push(href);
      await sleep(DELAY);
    });
  };

  const onClick: MouseEventHandler<HTMLDivElement> = (e) => {
    const a = (e.target as Element).closest("a");
    if (a) {
      e.preventDefault();
      const href = a.getAttribute("href");
      if (href) {
        navigate(href);
      }
    }
  };

  return (
    <Context.Provider value={{ pending, navigate }}>
      <div onClickCapture={onClick} className={className}>
        {children}
      </div>
    </Context.Provider>
  );
}

export function Animate({ children, className }: Props) {
  const { pending } = usePageTransition();
  return (
    <AnimatePresence>
      {!pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}