import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TagType, ImageType, Config } from '~/types'

export type ButtonState = {
  tagAdd: boolean
  tagEdit: boolean
  tag: TagType
  image: ImageType
  imageEdit: boolean
  imageViewData: ImageType
  imageView: boolean
  s3Edit: boolean
  s3Data: Config[]
  r2Edit: boolean
  r2Data: Config[]
  aListEdit: boolean
  aListData: Config[]
  MasonryView: boolean
  MasonryViewData: ImageType
  tagHelp: boolean
  imageHelp: boolean
}

export type ButtonActions = {
  setTagAdd: (tagAdd: boolean) => void
  setTagEdit: (tagEdit: boolean) => void
  setTagEditData: (tag: TagType) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
  setImageView: (imageView: boolean) => void
  setImageViewData: (imageViewData: ImageType) => void
  setS3Edit: (s3Edit: boolean) => void
  setS3EditData: (s3Data: Config[]) => void
  setR2Edit: (r2Edit: boolean) => void
  setR2EditData: (r2Data: Config[]) => void
  setAListEdit: (aListEdit: boolean) => void
  setAListEditData: (aListData: Config[]) => void
  setMasonryView: (masonryView: boolean) => void
  setMasonryViewData: (masonryViewData: ImageType) => void
  setTagHelp: (tagHelp: boolean) => void
  setImageHelp: (imageHelp: boolean) => void
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
    imageViewData: {} as ImageType,
    s3Edit: false,
    s3Data: [] as Config[],
    r2Edit: false,
    r2Data: [] as Config[],
    aListEdit: false,
    aListData: [] as Config[],
    MasonryView: false,
    MasonryViewData: {} as ImageType,
    tagHelp: false,
    imageHelp: false,
  }
}

export const defaultInitState: ButtonState = {
  tagAdd: false,
  tagEdit: false,
  tag: {} as TagType,
  imageEdit: false,
  image: {} as ImageType,
  imageView: false,
  imageViewData: {} as ImageType,
  s3Edit: false,
  s3Data: [] as Config[],
  r2Edit: false,
  r2Data: [] as Config[],
  aListEdit: false,
  aListData: [] as Config[],
  MasonryView: false,
  MasonryViewData: {} as ImageType,
  tagHelp: false,
  imageHelp: false,
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
        setS3Edit: (s3EditValue) => set(() => ({
          s3Edit: s3EditValue,
        })),
        setS3EditData: (s3DataValue) => set(() => ({
          s3Data: s3DataValue,
        })),
        setR2Edit: (r2EditValue) => set(() => ({
          r2Edit: r2EditValue,
        })),
        setR2EditData: (r2DataValue) => set(() => ({
          r2Data: r2DataValue,
        })),
        setAListEdit: (aListEditValue) => set(() => ({
          aListEdit: aListEditValue,
        })),
        setAListEditData: (aListDataValue) => set(() => ({
          aListData: aListDataValue,
        })),
        setMasonryView: (masonryViewValue) => set(() => ({
          MasonryView: masonryViewValue,
        })),
        setMasonryViewData: (masonryViewDataValue) => set(() => ({
          MasonryViewData: masonryViewDataValue,
        })),
        setTagHelp: (tagHelpValue) => set(() => ({
          tagHelp: tagHelpValue,
        })),
        setImageHelp: (imageHelpValue) => set(() => ({
          imageHelp: imageHelpValue,
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