'use client'

import { type ReactNode, createContext, useRef, useContext } from 'react'
import { type StoreApi, useStore } from 'zustand'

import { type ButtonStore, createButtonStore, initButtonStore } from '~/stores/buttonStores'

export const ButtonStoreContext = createContext<StoreApi<ButtonStore> | null>(
  null,
)

export interface ButtonStoreProviderProps {
  children: ReactNode
}

export const ButtonStoreProvider = ({
  children,
}: ButtonStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ButtonStore>>()
  if (!storeRef.current) {
    storeRef.current = createButtonStore(initButtonStore())
  }

  return (
    <ButtonStoreContext.Provider value={storeRef.current}>
      {children}
    </ButtonStoreContext.Provider>
  )
}

export const useButtonStore = <T,>(
  selector: (store: ButtonStore) => T,
): T => {
  const buttonStoreContext = useContext(ButtonStoreContext)

  if (!buttonStoreContext) {
    throw new Error(`useButtonStore must be use within ButtonStoreProvider`)
  }

  return useStore(buttonStoreContext, selector)
}
