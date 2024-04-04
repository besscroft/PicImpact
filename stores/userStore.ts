import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

export type UserState = {
  token: string
}

export type UserActions = {
  setToken: (token: string) => void
  removeToken: () => void
}

export type UserStore = UserState & UserActions

export const initUserStore = (): UserState => {
  return { token: '' }
}

export const defaultInitState: UserState = {
  token: '',
}

export const createUserStore = (
  initState: UserState = defaultInitState,
) => {
  return createStore<UserStore>()(
    persist(
      (set, get) => ({
        ...initState,
        setToken: (tokenStr) => set(() => ({
          token: tokenStr
        })),
        removeToken: () => set(() => ({ token: '' })),
      }),
      {
        name: 'pic-impact-storage', // name of the item in the storage (must be unique)
        storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        skipHydration: true,
      },
    )
  )
}