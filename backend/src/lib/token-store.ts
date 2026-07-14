import crypto from 'crypto';
import { prisma } from './db.js';
import { refreshAccessToken } from './excel365.js';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.MS_TOKEN_ENCRYPTION_KEY
  ? Buffer.from(process.env.MS_TOKEN_ENCRYPTION_KEY, 'hex')
  : null;

function getKey(): Buffer {
  if (!KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: MS_TOKEN_ENCRYPTION_KEY not set in production');
      process.exit(1);
    }
    // ponytail: dev-only fallback — never use in prod
    console.warn('[TokenStore] MS_TOKEN_ENCRYPTION_KEY not set — using dev-only key');
    return crypto.createHash('sha256').update('dev-only-key-do-not-use-in-prod').digest();
  }
  return KEY;
}

function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv:tag:ciphertext — all base64
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(payload: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export async function saveTokens(userId: string, tokens: TokenData): Promise<void> {
  const payload = encrypt(JSON.stringify(tokens));
  await prisma.user.update({
    where: { id: userId },
    data: { microsoftToken: payload },
  });
}

// ponytail: refreshes expired tokens but keeps the same refreshToken — rotate if Microsoft enforces it
export async function getTokens(userId: string): Promise<TokenData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { microsoftToken: true },
  });
  if (!user?.microsoftToken) return null;

  let tokens: TokenData;
  try {
    tokens = JSON.parse(decrypt(user.microsoftToken)) as TokenData;
  } catch {
    // corrupted or wrong key — clear and return null
    await deleteTokens(userId);
    return null;
  }

  // If expired within 5 min, refresh
  if (tokens.expiresAt - Date.now() < 300_000) {
    try {
      const refreshed = await refreshAccessToken(
        process.env.MS_CLIENT_ID || '',
        process.env.MS_CLIENT_SECRET || '',
        tokens.refreshToken,
      );
      tokens.accessToken = refreshed.accessToken;
      tokens.expiresAt = Date.now() + refreshed.expiresIn * 1000;
      await saveTokens(userId, tokens);
    } catch (err) {
      console.error(`[TokenStore] Refresh failed for ${userId}:`, err);
      // Return existing tokens anyway — caller may still succeed or get 401
    }
  }

  return tokens;
}

export async function deleteTokens(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { microsoftToken: null },
  });
}
