// AES-GCM Client-Side Encryption Utility
// Key is derived from schoolId + a shared app secret

const ENC_SECRET = 'cbt-school-secure-v1';

async function deriveKey(schoolId) {
    const raw = new TextEncoder().encode(ENC_SECRET + schoolId);
    const hash = await crypto.subtle.digest('SHA-256', raw);
    return await crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptMessage(plaintext, schoolId) {
    if (!plaintext) return plaintext;
    try {
        const key = await deriveKey(schoolId);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(plaintext);
        const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
        // Pack iv + ciphertext into base64
        const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(ciphertext), iv.byteLength);
        return btoa(String.fromCharCode(...combined));
    } catch {
        return plaintext; // fallback to plaintext if crypto fails
    }
}

export async function decryptMessage(ciphertext, schoolId) {
    if (!ciphertext) return ciphertext;
    try {
        const key = await deriveKey(schoolId);
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        return new TextDecoder().decode(plaintext);
    } catch {
        return ciphertext; // fallback: display as-is if not encrypted
    }
}
