import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ButtonState = {
  tagAdd: boolean
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return { tagAdd: false }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
}

export const createButtonStore = (
  initState: ButtonState = defaultInitState,
) => {
  return createStore<ButtonStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setTagAdd: (tagAddValue) => set(() => ({
          tagAdd: tagAddValue
        })),
      }),
      {
        name: 'pic-impact-button-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        skipHydration: true,
      },
    )
  )
}