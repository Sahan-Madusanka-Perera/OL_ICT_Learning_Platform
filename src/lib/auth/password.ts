import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * `promisify(scrypt)` loses the options overload in TypeScript, so we wrap
 * it directly rather than casting the parameters away.
 */
function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey),
    );
  });
}

/**
 * Password hashing with scrypt from the Node standard library.
 *
 * scrypt is memory-hard, which is what makes GPU cracking expensive. The
 * parameters below cost roughly 100 ms per hash on a small server — slow
 * enough to matter to an attacker, fast enough that a student logging in on
 * a phone does not notice.
 *
 * No third-party dependency handles passwords here, on purpose.
 */

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    KEY_LENGTH,
    SCRYPT_PARAMS,
  );

  return `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

/**
 * Verify a password. Always constant-time, and never throws on a malformed
 * stored hash — a corrupt row must read as "wrong password", not as a 500
 * that tells an attacker something interesting.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [, n, r, p, saltB64, hashB64] = parts;
    const salt = Buffer.from(saltB64!, 'base64');
    const expected = Buffer.from(hashB64!, 'base64');

    const derived = await scryptAsync(password.normalize('NFKC'), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Password policy.
 *
 * Length is the requirement that actually matters, so we ask for 10
 * characters and skip the symbol-and-capital theatre that pushes students
 * toward "Password1!" and a sticky note. We do block the handful of
 * passwords that show up in every breach corpus.
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwertyuiop', 'iloveyou', 'sunshine', 'princess', 'football', 'welcome123',
  'abc12345', 'letmein123', 'admin123', 'srilanka', 'colombo123',
]);

export type PasswordCheck = { ok: true } | { ok: false; message: string };

export function checkPasswordStrength(password: string, email?: string): PasswordCheck {
  if (password.length < 10) {
    return { ok: false, message: 'Use at least 10 characters. A short phrase works well.' };
  }
  if (password.length > 200) {
    return { ok: false, message: 'That password is too long.' };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: 'That password is too common. Pick something less guessable.' };
  }
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, message: 'That password is a single repeated character.' };
  }
  if (email) {
    const local = email.split('@')[0]?.toLowerCase();
    if (local && local.length > 3 && password.toLowerCase().includes(local)) {
      return { ok: false, message: 'Your password should not contain your email address.' };
    }
  }
  return { ok: true };
}
