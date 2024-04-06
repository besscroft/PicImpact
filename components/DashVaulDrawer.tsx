'use client'

import { Drawer } from 'vaul'
import { useRouter } from 'next/navigation'
import React from 'react';
import { Listbox, ListboxItem } from '@nextui-org/react'

export default function DashVaulDrawer() {
  const router = useRouter()

  return (
    <Drawer.Root>
      <Drawer.Trigger>Mobile菜单</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 dark:bg-slate-800" />
        <Drawer.Content className="bg-zinc-100 dark:bg-slate-900 flex flex-col rounded-t-[10px] h-[88%] mt-24 fixed bottom-0 left-0 right-0">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[10px] flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
            <div className="flex flex-col gap-4">
              <div className="w-full px-1 py-2 rounded-small">
                <Listbox
                  aria-label="Actions"
                >
                  <ListboxItem key="new">菜单1</ListboxItem>
                  <ListboxItem key="copy">菜单2</ListboxItem>
                  <ListboxItem key="edit">菜单3</ListboxItem>
                  <ListboxItem key="delete" className="text-danger" color="danger">
                    菜单4
                  </ListboxItem>
                </Listbox>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-100 dark:bg-slate-800 border-t border-zinc-200 mt-auto">
            <div className="flex gap-6 justify-end max-w-md mx-auto">
              <a
                className="text-xs text-zinc-600 flex items-center gap-0.25"
                href="https://github.com/besscroft"
                target="_blank"
              >
                GitHub
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="16"
                  aria-hidden="true"
                  className="w-3 h-3 ml-1"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14L21 3"></path>
                </svg>
              </a>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}