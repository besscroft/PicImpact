import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AlbumType, ImageType, Config } from '~/types'

export type ButtonState = {
  albumAdd: boolean
  albumEdit: boolean
  album: AlbumType
  image: ImageType
  imageEdit: boolean
  imageViewData: ImageType
  imageView: boolean
  s3Edit: boolean
  s3Data: Config[]
  r2Edit: boolean
  r2Data: Config[]
  openListEdit: boolean
  openListData: Config[]
  MasonryView: boolean
  MasonryViewData: ImageType
  MasonryViewDataList: ImageType[]
  imageBatchDelete: boolean
  searchOpen: boolean
  loginHelp: boolean
  command: boolean
}

export type ButtonActions = {
  setAlbumAdd: (albumAdd: boolean) => void
  setAlbumEdit: (albumEdit: boolean) => void
  setAlbumEditData: (album: AlbumType) => void
  setImageEdit: (imageEdit: boolean) => void
  setImageEditData: (image: ImageType) => void
  setImageView: (imageView: boolean) => void
  setImageViewData: (imageViewData: ImageType) => void
  setS3Edit: (s3Edit: boolean) => void
  setS3EditData: (s3Data: Config[]) => void
  setR2Edit: (r2Edit: boolean) => void
  setR2EditData: (r2Data: Config[]) => void
  setOpenListEdit: (openListEdit: boolean) => void
  setOpenListEditData: (openListData: Config[]) => void
  setMasonryView: (masonryView: boolean) => void
  setMasonryViewData: (masonryViewData: ImageType) => void
  setMasonryViewDataList: (masonryViewDataList: ImageType[]) => void
  setImageBatchDelete: (imageBatchDelete: boolean) => void
  setSearchOpen: (searchOpen: boolean) => void
  setLoginHelp: (loginHelp: boolean) => void
  setCommand: (command: boolean) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    albumAdd: false,
    albumEdit: false,
    album: {} as AlbumType,
    imageEdit: false,
    image: {} as ImageType,
    imageView: false,
    imageViewData: {} as ImageType,
    s3Edit: false,
    s3Data: [] as Config[],
    r2Edit: false,
    r2Data: [] as Config[],
    openListEdit: false,
    openListData: [] as Config[],
    MasonryView: false,
    MasonryViewData: {} as ImageType,
    MasonryViewDataList: [] as ImageType[],
    imageBatchDelete: false,
    searchOpen: false,
    loginHelp: false,
    command: false,
  }
}

export const defaultInitState: ButtonState = {
  albumAdd: false,
  albumEdit: false,
  album: {} as AlbumType,
  imageEdit: false,
  image: {} as ImageType,
  imageView: false,
  imageViewData: {} as ImageType,
  s3Edit: false,
  s3Data: [] as Config[],
  r2Edit: false,
  r2Data: [] as Config[],
  openListEdit: false,
  openListData: [] as Config[],
  MasonryView: false,
  MasonryViewData: {} as ImageType,
  MasonryViewDataList: [] as ImageType[],
  imageBatchDelete: false,
  searchOpen: false,
  loginHelp: false,
  command: false,
}

export const createButtonStore = (
  initState: ButtonState = defaultInitState,
) => {
  return createStore<ButtonStore>()(
    persist(
      (set) => ({
        ...initState,
        setAlbumAdd: (albumAddValue) => set(() => ({
          albumAdd: albumAddValue,
        })),
        setAlbumEdit: (albumEditValue) => set(() => ({
          albumEdit: albumEditValue,
        })),
        setAlbumEditData: (albumValue) => set(() => ({
          album: albumValue,
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
        setOpenListEdit: (openListEditValue) => set(() => ({
          openListEdit: openListEditValue,
        })),
        setOpenListEditData: (openListDataValue) => set(() => ({
          openListData: openListDataValue,
        })),
        setMasonryView: (masonryViewValue) => set(() => ({
          MasonryView: masonryViewValue,
        })),
        setMasonryViewData: (masonryViewDataValue) => set(() => ({
          MasonryViewData: masonryViewDataValue,
        })),
        setMasonryViewDataList: (masonryViewDataListValue) => set(() => ({
          MasonryViewDataList: masonryViewDataListValue,
        })),
        setImageBatchDelete: (imageBatchDeleteValue) => set(() => ({
          imageBatchDelete: imageBatchDeleteValue,
        })),
        setSearchOpen: (searchOpenValue) => set(() => ({
          searchOpen: searchOpenValue,
        })),
        setLoginHelp: (loginHelpValue) => set(() => ({
          loginHelp: loginHelpValue,
        })),
        setCommand: (commandValue) => set(() => ({
          command: commandValue,
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