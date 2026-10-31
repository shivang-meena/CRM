import { createHash } from 'node:crypto';

/**
 * Short fingerprint of a password hash. It changes whenever the password changes,
 * so tokens issued before a password change can be rejected.
 */
export function passwordFingerprint(passwordHash: string | null | undefined): string {
  return createHash('sha256')
    .update(passwordHash ?? '')
    .digest('hex')
    .slice(0, 16);
}
