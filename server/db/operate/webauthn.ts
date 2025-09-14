import { db } from '~/server/lib/db'

export interface CreateWebAuthnCredentialData {
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceType?: string
  backedUp?: boolean
  transports?: string[]
}

export interface CreateWebAuthnChallengeData {
  challenge: string
  userId?: string
  type: 'registration' | 'authentication'
  expiresAt: Date
}

/**
 * 创建 WebAuthn 凭证
 */
export async function createWebAuthnCredential(data: CreateWebAuthnCredentialData) {
  return await db.webAuthnCredential.create({
    data: {
      userId: data.userId,
      credentialId: data.credentialId,
      publicKey: data.publicKey,
      counter: data.counter,
      deviceType: data.deviceType,
      backedUp: data.backedUp ?? false,
      transports: data.transports ?? [],
    },
  })
}

/**
 * 根据凭证 ID 查找 WebAuthn 凭证
 */
export async function findWebAuthnCredential(credentialId: string) {
  return await db.webAuthnCredential.findUnique({
    where: {
      credentialId,
    },
    include: {
      user: true,
    },
  })
}

/**
 * 根据用户 ID 查找所有 WebAuthn 凭证
 */
export async function findWebAuthnCredentialsByUserId(userId: string) {
  return await db.webAuthnCredential.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * 更新凭证计数器
 */
export async function updateCredentialCounter(credentialId: string, counter: number) {
  return await db.webAuthnCredential.update({
    where: {
      credentialId,
    },
    data: {
      counter,
      updatedAt: new Date(),
    },
  })
}

/**
 * 删除 WebAuthn 凭证
 */
export async function deleteWebAuthnCredential(credentialId: string) {
  return await db.webAuthnCredential.delete({
    where: {
      credentialId,
    },
  })
}

/**
 * 创建 WebAuthn 挑战
 */
export async function createWebAuthnChallenge(data: CreateWebAuthnChallengeData) {
  return await db.webAuthnChallenge.create({
    data: {
      challenge: data.challenge,
      userId: data.userId,
      type: data.type,
      expiresAt: data.expiresAt,
    },
  })
}

/**
 * 根据挑战查找 WebAuthn 挑战
 */
export async function findWebAuthnChallenge(challenge: string) {
  return await db.webAuthnChallenge.findFirst({
    where: {
      challenge,
      expiresAt: {
        gt: new Date(), // 只查找未过期的挑战
      },
    },
    include: {
      user: true,
    },
  })
}

/**
 * 删除 WebAuthn 挑战
 */
export async function deleteWebAuthnChallenge(challenge: string) {
  return await db.webAuthnChallenge.deleteMany({
    where: {
      challenge,
    },
  })
}

/**
 * 清理过期的挑战
 */
export async function cleanupExpiredChallenges() {
  return await db.webAuthnChallenge.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
}

/**
 * 根据用户 ID 删除所有 WebAuthn 凭证
 */
export async function deleteAllWebAuthnCredentialsByUserId(userId: string) {
  return await db.webAuthnCredential.deleteMany({
    where: {
      userId,
    },
  })
}
