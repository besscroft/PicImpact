'use client'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '~/components/ui/command.tsx'
import { useButtonStore } from '~/app/providers/button-store-providers.tsx'
import { useRouter } from 'next-nprogress-bar'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { SquareTerminalIcon } from '~/components/icons/square-terminal.tsx'
import { SunMoonIcon } from '~/components/icons/sun-moon.tsx'
import { SunMediumIcon } from '~/components/icons/sun-medium.tsx'
import { UserIcon } from '~/components/icons/user.tsx'
import { authClient } from '~/server/auth/auth-client.ts'
import { useIsHydrated } from '~/hooks/use-is-hydrated'
import { AnimatedIconTrigger, mergeAnimatedTriggerProps } from '~/components/icons/animated-trigger'

export default function Command() {
  const { command, setCommand } = useButtonStore(
    (state) => state,
  )
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const isHydrated = useIsHydrated()
  const t = useTranslations()
  const shortcut = isHydrated && /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K'

  const closeClasses = 'flex items-center space-x-2 w-full p-1 rounded-small active:scale-95 duration-200 ease-in-out cursor-pointer'
  const themeToggleLabel = isHydrated
    ? t(resolvedTheme === 'light' ? 'Button.dark' : 'Button.light')
    : t('Button.theme')

  return (
    <>
      <CommandDialog open={command} onOpenChange={setCommand}>
        <CommandInput placeholder={`${t('Command.placeholder', { defaultValue: 'Type a command or search...' })} (${shortcut})`} />
        <CommandList>
          <CommandEmpty>{t('Command.noResults', { defaultValue: 'No results found.' })}</CommandEmpty>
          {session ?
            <CommandGroup heading={t('Command.menu', { defaultValue: 'Menu' })}>
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <CommandItem
                    {...mergeAnimatedTriggerProps({
                      className: closeClasses,
                      onSelect: () => {
                        router.push('/admin')
                        setCommand(false)
                      },
                    }, triggerProps)}
                  >
                    <SquareTerminalIcon ref={iconRef} size={18} />
                    <span>{t('Link.dashboard')}</span>
                  </CommandItem>
                )}
              </AnimatedIconTrigger>
            </CommandGroup> :
            <CommandGroup heading={t('Command.menu', { defaultValue: 'Menu' })}>
              <AnimatedIconTrigger>
                {({ iconRef, triggerProps }) => (
                  <CommandItem
                    {...mergeAnimatedTriggerProps({
                      className: closeClasses,
                      onSelect: () => {
                        router.push('/login')
                        setCommand(false)
                      },
                    }, triggerProps)}
                  >
                    <UserIcon ref={iconRef} size={18} />
                    <span>{t('Login.signIn')}</span>
                  </CommandItem>
                )}
              </AnimatedIconTrigger>
            </CommandGroup>
          }
          <CommandSeparator />
          <CommandGroup heading={t('Command.settings', { defaultValue: 'Settings' })}>
            <AnimatedIconTrigger>
              {({ iconRef, triggerProps }) => (
                <CommandItem
                  {...mergeAnimatedTriggerProps({
                    className: closeClasses,
                    disabled: !isHydrated,
                    onSelect: () => {
                      if (!isHydrated) {
                        return
                      }
                      setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
                    },
                  }, triggerProps)}
                >
                  {!isHydrated ? <SunMoonIcon ref={iconRef} size={18} /> : resolvedTheme === 'light' ? <SunMoonIcon ref={iconRef} size={18} /> : <SunMediumIcon ref={iconRef} size={18} />}
                  <p>{themeToggleLabel}</p>
                </CommandItem>
              )}
            </AnimatedIconTrigger>
            <CommandItem className="justify-end">
              <a
                className="text-xs text-muted-foreground flex items-center gap-0.25"
                href="https://github.com/besscroft/PicImpact"
                target="_blank"
                rel="noreferrer"
              >
                {t('Command.github', { defaultValue: 'GitHub' })}
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                  aria-hidden="true"
                  className="w-3 h-3 ml-1"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                </svg>
              </a>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
