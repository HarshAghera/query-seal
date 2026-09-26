import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export function encrypt<T>(data: T, secret: string): string {
  if (!secret) {
    throw new Error('Encryption secret is required');
  }

  const key = getKey(secret);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
}

export function decrypt<T>(token: string, secret: string): T {
  if (!secret) {
    throw new Error('Decryption secret is required');
  }

  if (!token) {
    throw new Error('Encrypted token is required');
  }

  const key = getKey(secret);
  const data = Buffer.from(token, 'base64url');

  if (data.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted token');
  }

  const iv = data.subarray(0, IV_LENGTH);

  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);

  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    throw new Error(
      'Unable to decrypt token. The token may be invalid, tampered with, or the secret may be incorrect.',
    );
  }
}
