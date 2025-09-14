'use client'

import { useState, useEffect } from 'react'
import { authClient } from '~/server/auth/auth-client'

interface Passkey {
  id: string
  name?: string
  createdAt: Date
  deviceType: string
  backedUp: boolean
  transports?: string
  credentialID: string
  aaguid?: string
}

export function usePasskeyStatus() {
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: session } = authClient.useSession()

  const loadPasskeys = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await authClient.passkey.listUserPasskeys()

      if (result?.error) {
        setError('Failed to load passkeys')
        return
      }

      if (result?.data) {
        setPasskeys(result.data)
      }
    } catch (err) {
      console.error('Error loading passkeys:', err)
      setError('Error loading passkeys')
    } finally {
      setLoading(false)
    }
  }

  const addPasskey = async (name?: string) => {
    try {
      const result = await authClient.passkey.addPasskey({
        name: name || `PicImpact-${new Date().toLocaleDateString()}`
      })

      if (result?.error) {
        throw new Error(result.error.message)
      }

      // 重新加载 passkeys 列表
      await loadPasskeys()
      return { success: true }
    } catch (error) {
      console.error('Add passkey error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add passkey'
      }
    }
  }

  const deletePasskey = async (passkeyId: string) => {
    try {
      const result = await authClient.passkey.deletePasskey({
        id: passkeyId
      })

      if (result?.error) {
        throw new Error(result.error.message)
      }

      // 重新加载 passkeys 列表
      await loadPasskeys()
      return { success: true }
    } catch (error) {
      console.error('Delete passkey error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete passkey'
      }
    }
  }

  const hasPasskeys = passkeys.length > 0
  const isPasskeySupported = typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable

  useEffect(() => {
    if (session?.user) {
      loadPasskeys()
    }
  }, [session])

  return {
    passkeys,
    loading,
    error,
    hasPasskeys,
    isPasskeySupported,
    addPasskey,
    deletePasskey,
    refresh: loadPasskeys
  }
}