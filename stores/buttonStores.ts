import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TagType } from '~/types'

export type ButtonState = {
  tagAdd: boolean
  tagEdit: boolean
  tag: TagType
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
  setTagEdit: (tagEdit: boolean) => void
  setTagEditData: (tag: TagType) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    tagAdd: false,
    tagEdit: false,
    tag: {} as TagType
  }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
  tagEdit: false,
  tag: {} as TagType
}

export const createButtonStore = (
  initState: ButtonState = defaultInitState,
) => {
  return createStore<ButtonStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setTagAdd: (tagAddValue) => set(() => ({
          tagAdd: tagAddValue,
        })),
        setTagEdit: (tagEditValue) => set(() => ({
          tagEdit: tagEditValue,
        })),
        setTagEditData: (tagValue) => set(() => ({
          tag: tagValue,
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