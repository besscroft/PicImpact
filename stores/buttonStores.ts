import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TagType, ImageType } from '~/types'

export type ButtonState = {
  tagAdd: boolean
  tagEdit: boolean
  tag: TagType
  image: ImageType
  imageAdd: boolean
  imageEdit: boolean
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
  setTagEdit: (tagEdit: boolean) => void
  setTagEditData: (tag: TagType) => void
  setImageAdd: (imageAdd: boolean) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    tagAdd: false,
    tagEdit: false,
    tag: {} as TagType,
    imageAdd: false,
    imageEdit: false,
    image: {} as ImageType
  }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
  tagEdit: false,
  tag: {} as TagType,
  imageAdd: false,
  imageEdit: false,
  image: {} as ImageType
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
        })),
        setImageAdd: (imageAddValue) => set(() => ({
          imageAdd: imageAddValue,
        })),
        setImageEdit: (imageEditValue) => set(() => ({
          imageEdit: imageEditValue,
        })),
        setImageEditData: (imageValue) => set(() => ({
          image: imageValue,
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