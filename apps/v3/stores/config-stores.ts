import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ConfigState = {
  customIndexDownloadEnable: boolean
}

export type ConfigActions = {
  setCustomIndexDownloadEnable: (albumAdd: boolean) => void
}

export type ConfigStore = ConfigState & ConfigActions

export const initConfigStore = (): ConfigState => {
  return {
    customIndexDownloadEnable: false,
  }
}

export const defaultInitState: ConfigState = {
  customIndexDownloadEnable: false,
}

export const createConfigStore = (
  initState: ConfigState = defaultInitState,
) => {
  return createStore<ConfigStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setCustomIndexDownloadEnable: (customIndexDownloadEnableValue) => set(() => ({
          customIndexDownloadEnable: customIndexDownloadEnableValue,
        })),
      }),
      {
        name: 'pic-impact-Config-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        skipHydration: true,
      },
    )
  )
}