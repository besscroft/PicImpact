import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AlbumType, ImageType, Config, CopyrightType } from '~/types'

export type ButtonState = {
  albumAdd: boolean
  albumEdit: boolean
  album: AlbumType
  copyrightAdd: boolean
  copyrightEdit: boolean
  copyright: CopyrightType
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
  MasonryViewDataList: ImageType[]
  albumHelp: boolean
  imageHelp: boolean
  uploadHelp: boolean
  imageBatchDelete: boolean
  searchOpen: boolean
}

export type ButtonActions = {
  setAlbumAdd: (albumAdd: boolean) => void
  setAlbumEdit: (albumEdit: boolean) => void
  setAlbumEditData: (album: AlbumType) => void
  setCopyrightAdd: (copyrightAdd: boolean) => void
  setCopyrightEdit: (copyrightEdit: boolean) => void
  setCopyrightEditData: (copyright: CopyrightType) => void
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
  setMasonryViewDataList: (masonryViewDataList: ImageType[]) => void
  setAlbumHelp: (albumHelp: boolean) => void
  setImageHelp: (imageHelp: boolean) => void
  setUploadHelp: (uploadHelp: boolean) => void
  setImageBatchDelete: (imageBatchDelete: boolean) => void
  setSearchOpen: (searchOpen: boolean) => void
}

export type ButtonStore = ButtonState & ButtonActions

export const initButtonStore = (): ButtonState => {
  return {
    albumAdd: false,
    albumEdit: false,
    album: {} as AlbumType,
    copyrightAdd: false,
    copyrightEdit: false,
    copyright: {} as CopyrightType,
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
    MasonryViewDataList: [] as ImageType[],
    albumHelp: false,
    imageHelp: false,
    uploadHelp: false,
    imageBatchDelete: false,
    searchOpen: false,
  }
}

export const defaultInitState: ButtonState = {
  albumAdd: false,
  albumEdit: false,
  album: {} as AlbumType,
  copyrightAdd: false,
  copyrightEdit: false,
  copyright: {} as CopyrightType,
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
  MasonryViewDataList: [] as ImageType[],
  albumHelp: false,
  imageHelp: false,
  uploadHelp: false,
  imageBatchDelete: false,
  searchOpen: false,
}

export const createButtonStore = (
  initState: ButtonState = defaultInitState,
) => {
  return createStore<ButtonStore>()(
    persist(
      (set, get) => ({
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
        setCopyrightAdd: (copyrightAddValue) => set(() => ({
          copyrightAdd: copyrightAddValue,
        })),
        setCopyrightEdit: (copyrightEditValue) => set(() => ({
          copyrightEdit: copyrightEditValue,
        })),
        setCopyrightEditData: (copyrightValue) => set(() => ({
          copyright: copyrightValue,
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
        setMasonryViewDataList: (masonryViewDataListValue) => set(() => ({
          MasonryViewDataList: masonryViewDataListValue,
        })),
        setAlbumHelp: (albumHelpValue) => set(() => ({
          albumHelp: albumHelpValue,
        })),
        setImageHelp: (imageHelpValue) => set(() => ({
          imageHelp: imageHelpValue,
        })),
        setUploadHelp: (uploadHelpValue) => set(() => ({
          uploadHelp: uploadHelpValue,
        })),
        setImageBatchDelete: (imageBatchDeleteValue) => set(() => ({
          imageBatchDelete: imageBatchDeleteValue,
        })),
        setSearchOpen: (searchOpenValue) => set(() => ({
          searchOpen: searchOpenValue,
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