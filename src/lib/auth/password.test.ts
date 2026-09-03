import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, checkPasswordStrength } from './password';

describe('password hashing', () => {
  it('accepts the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('Correct horse battery staple', hash)).toBe(false);
  });

  it('produces a different hash every time (unique salt)', async () => {
    const a = await hashPassword('same-password-here');
    const b = await hashPassword('same-password-here');
    expect(a).not.toBe(b);
    expect(await verifyPassword('same-password-here', a)).toBe(true);
    expect(await verifyPassword('same-password-here', b)).toBe(true);
  });

  it('never stores the password in the hash string', async () => {
    const hash = await hashPassword('supersecretvalue');
    expect(hash).not.toContain('supersecretvalue');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('returns false rather than throwing on a corrupt stored hash', async () => {
    for (const bad of ['', 'garbage', 'scrypt$1$2', 'bcrypt$1$2$3$4$5', '$$$$$']) {
      expect(await verifyPassword('anything', bad)).toBe(false);
    }
  });

  it('handles unicode passwords consistently', async () => {
    const hash = await hashPassword('පරීක්ෂණ-මුරපදය-2026');
    expect(await verifyPassword('පරීක්ෂණ-මුරපදය-2026', hash)).toBe(true);
  });
});

describe('password policy', () => {
  it('requires real length', () => {
    expect(checkPasswordStrength('short').ok).toBe(false);
    expect(checkPasswordStrength('a-long-enough-passphrase').ok).toBe(true);
  });

  it('rejects breach-corpus favourites', () => {
    expect(checkPasswordStrength('password123').ok).toBe(false);
    expect(checkPasswordStrength('colombo123').ok).toBe(false);
  });

  it('rejects a password containing the email local part', () => {
    expect(checkPasswordStrength('nimalperera2026', 'nimalperera@example.lk').ok).toBe(false);
  });

  it('rejects a single repeated character', () => {
    expect(checkPasswordStrength('aaaaaaaaaaaaaa').ok).toBe(false);
  });

  it('does not demand symbols and capitals', () => {
    // The theatre that produces "Password1!" on a sticky note.
    expect(checkPasswordStrength('my favourite sandwich is fish').ok).toBe(true);
  });
});
