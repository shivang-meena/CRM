import { HttpException, HttpStatus } from '@nestjs/common';

const MAX_FAILURES = 5;
const COOLDOWN_MS = 60 * 1000;

export class LoginAttempts {
  private readonly failures = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  assertAllowed(key: string): void {
    const entry = this.failures.get(key);
    if (!entry) return;
    if (Date.now() >= entry.expiresAt) {
      this.failures.delete(key);
      return;
    }
    if (entry.count >= MAX_FAILURES) this.tooManyAttempts();
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const previous = this.failures.get(key);
    if (previous && now < previous.expiresAt && previous.count >= MAX_FAILURES)
      this.tooManyAttempts();
    const count = previous && now < previous.expiresAt ? previous.count + 1 : 1;
    this.failures.set(key, { count, expiresAt: now + COOLDOWN_MS });
    if (count >= MAX_FAILURES) this.tooManyAttempts();
  }

  reset(key: string): void {
    this.failures.delete(key);
  }

  private tooManyAttempts(): never {
    throw new HttpException(
      'Too many failed attempts. Try again after 1 minute.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
