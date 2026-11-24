'use client'

import { toast } from 'sonner'
import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { RocketIcon, ReloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { authClient } from '~/server/auth/auth-client'
import { PasskeyRegister } from '~/components/auth/passkey-register'
import { Fingerprint, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

export default function PasskeySettings() {
  const t = useTranslations('Passkey')
  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState('')

  const { data: session, isPending } = authClient.useSession()

  // 加载用户的 passkeys
  const loadPasskeys = async () => {
    try {
      setLoading(true)
      const { data, error } = await authClient.passkey.listUserPasskeys()

      if (error) {
        console.error('Failed to load passkeys:', error)
        toast.error(t('loadError'))
        return
      }

      if (data) {
        setPasskeys(data)
      }
    } catch (error) {
      console.error('Error loading passkeys:', error)
      toast.error(t('loadingError'))
    } finally {
      setLoading(false)
    }
  }

  // 删除 passkey
  const deletePasskey = async (passkeyId: string) => {
    try {
      setDeleteLoading(passkeyId)
      const { error } = await authClient.passkey.deletePasskey({
        id: passkeyId
      })

      if (error) {
        toast.error(t('deleteFailed'))
        return
      }

      toast.success(t('deleteSuccess'))
      loadPasskeys() // 重新加载列表
    } catch (error) {
      console.error('Delete passkey error:', error)
      toast.error(t('deleteFailed'))
    } finally {
      setDeleteLoading('')
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadPasskeys()
    }
  }, [session])

  const handlePasskeyRegistered = () => {
    loadPasskeys()
  }

  return (
    <div className="flex flex-col space-y-4 h-full flex-1 max-w-sm">
      <div className="flex items-center space-x-2">
        <Fingerprint className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t('title')}</h2>
      </div>

      {isPending ? (
        <p className="m-2">{t('syncingStatus')}</p>
      ) : (
        <div className="space-y-4">
          {/* 注册新的 Passkey */}
          <div className="space-y-2">
            <h3 className="text-md font-medium">{t('addNew')}</h3>
            <p className="text-sm text-muted-foreground text-wrap">
              {t('description')}
            </p>
            <PasskeyRegister
              email={session?.user?.email}
              onSuccess={handlePasskeyRegistered}
              className="w-full"
            />
          </div>

          {/* 现有的 Passkeys */}
          <div className="space-y-2">
            <h3 className="text-md font-medium">{t('registeredList', { count: passkeys.length })}</h3>

            {loading ? (
              <div className="flex items-center space-x-2">
                <ReloadIcon className="h-4 w-4 animate-spin" />
                <span>{t('loading')}</span>
              </div>
            ) : passkeys.length === 0 ? (
              <Alert className="max-w-sm">
                <Fingerprint className="h-4 w-4" />
                <AlertTitle>{t('noPasskeys')}</AlertTitle>
                <AlertDescription>
                  {t('noPasskeysDescription')}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <motion.div
                    key={passkey.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {passkey.deviceType === 'platform' ? (
                        <Smartphone className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Fingerprint className="h-5 w-5 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {passkey.name || t('unnamedPasskey')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('createdOn')}: {new Date(passkey.createdAt).toLocaleDateString()}
                          {passkey.backedUp && ` • ${t('backedUp')}`}
                          {passkey.deviceType === 'platform' ? ` • ${t('platformDevice')}` : ` • ${t('crossPlatformDevice')}`}
                        </p>
                        {passkey.credentialID && (
                          <p className="text-xs text-muted-foreground font-mono">
                            ID: {passkey.credentialID.slice(0, 12)}...
                          </p>
                        )}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{t('deletePasskey')}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>{t('deleteConfirmation')}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Passkey: {passkey.name || t('unnamedPasskey')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('createdOn')}: {new Date(passkey.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => deletePasskey(passkey.id)}
                            disabled={deleteLoading === passkey.id}
                            className="cursor-pointer"
                          >
                            {deleteLoading === passkey.id && (
                              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('confirmDelete')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 提示信息 */}
          {passkeys.length > 0 && (
            <Alert>
              <RocketIcon className="h-4 w-4" />
              <AlertTitle>{t('tipTitle')}</AlertTitle>
              <AlertDescription>
                {t('tipDescription')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}