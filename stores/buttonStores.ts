import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TagType } from '~/types'

export type ButtonState = {
  tagAdd: boolean
  tagEdit: boolean
  tag: TagType | null
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
  setTagEdit: (tagEdit: boolean, tag: TagType | null) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    tagAdd: false,
    tagEdit: false,
    tag: null
  }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
  tagEdit: false,
  tag: null
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
        setTagEdit: (tagEditValue, tagValue) => set(() => ({
          tagEdit: tagEditValue,
          tag: tagValue
        }))
      }),
      {
        name: 'pic-impact-button-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        skipHydration: true,
      },
    )
  )
}