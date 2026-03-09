import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes).")
  }
  return Buffer.from(hex, "hex")
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns "iv_hex:tag_hex:encrypted_hex"
 */
export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts a string produced by encrypt().
 */
export function decrypt(data: string): string {
  const parts = data.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted data format.")
  const [ivHex, tagHex, encryptedHex] = parts
  const key = getKey()
  const iv        = Buffer.from(ivHex, "hex")
  const tag       = Buffer.from(tagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher  = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

/**
 * Returns true if the value looks like an encrypted string (iv:tag:data).
 * Used to avoid double-encrypting on upserts.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":")
  return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/.test(p))
}
