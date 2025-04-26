'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { type StoreApi, useStore } from 'zustand'

import { type ConfigStore, createConfigStore, initConfigStore } from '~/stores/config-stores'

export const ConfigStoreContext = createContext<StoreApi<ConfigStore> | null>(
  null,
)

export interface ConfigStoreProviderProps {
  children: ReactNode
}

export const ConfigStoreProvider = ({
  children,
}: ConfigStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ConfigStore>>()
  if (!storeRef.current) {
    storeRef.current = createConfigStore(initConfigStore())
  }

  return (
    <ConfigStoreContext.Provider value={storeRef.current}>
      {children}
    </ConfigStoreContext.Provider>
  )
}

export const useConfigStore = <T,>(
  selector: (store: ConfigStore) => T,
): T => {
  const configStoreContext = useContext(ConfigStoreContext)

  if (!configStoreContext) {
    throw new Error('useConfigStore must be use within ConfigStoreProvider')
  }

  return useStore(configStoreContext, selector)
}
