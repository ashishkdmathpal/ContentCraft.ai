// AES-256 Encryption for API Keys
// Uses GCM mode for authenticated encryption

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const TAG_POSITION = SALT_LENGTH + IV_LENGTH
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH

const SECRET = process.env.ENCRYPTION_KEY

if (!SECRET || SECRET.length < 64) {
  console.warn('ENCRYPTION_KEY is not set or too short. Using default (INSECURE for production!)')
}

const ENCRYPTION_KEY = SECRET || '0'.repeat(64)

/**
 * Encrypt a plaintext string (e.g., API key)
 * @param text - The plaintext to encrypt
 * @returns Base64-encoded encrypted string with salt, IV, and auth tag
 */
export function encrypt(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512')
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64')
}

/**
 * Decrypt an encrypted string
 * @param encryptedData - Base64-encoded encrypted string from encrypt()
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64')

  const salt = buffer.subarray(0, SALT_LENGTH)
  const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION)
  const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION)
  const encrypted = buffer.subarray(ENCRYPTED_POSITION)

  const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
