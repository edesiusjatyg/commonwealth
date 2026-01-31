
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    // We expect a hex string of 32 bytes = 64 chars
    // Or we process it?
    // Let's assume the env var is the hex string directly.
    if (process.env.NODE_ENV === 'production' && (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64)) {
        console.warn("Invalid ENCRYPTION_KEY length. Must be 64 hex characters (32 bytes).");
    }
}

export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not set");

    const textParts = text.split(':');
    if (textParts.length !== 3) throw new Error("Invalid encrypted text format");

    const iv = Buffer.from(textParts[0], 'hex');
    const authTag = Buffer.from(textParts[1], 'hex');
    const encryptedText = Buffer.from(textParts[2], 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
