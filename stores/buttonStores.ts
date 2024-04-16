import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TagType, ImageType } from '~/types'

export type ButtonState = {
  tagAdd: boolean
  tagEdit: boolean
  tag: TagType
  image: ImageType
  imageEdit: boolean
  imageViewData: ImageType
  imageView: boolean
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
  setTagEdit: (tagEdit: boolean) => void
  setTagEditData: (tag: TagType) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
  setImageView: (imageView: boolean) => void
  setImageViewData: (imageViewData: ImageType) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    tagAdd: false,
    tagEdit: false,
    tag: {} as TagType,
    imageEdit: false,
    image: {} as ImageType,
    imageView: false,
    imageViewData: {} as ImageType
  }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
  tagEdit: false,
  tag: {} as TagType,
  imageEdit: false,
  image: {} as ImageType,
  imageView: false,
  imageViewData: {} as ImageType
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
        setImageEdit: (imageEditValue) => set(() => ({
          imageEdit: imageEditValue,
        })),
        setImageEditData: (imageDataValue) => set(() => ({
          image: imageDataValue,
        })),
        setImageView: (imageViewValue) => set(() => ({
          imageView: imageViewValue,
        })),
        setImageViewData: (imageViewDataValue) => set(() => ({
          imageViewData: imageViewDataValue,
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