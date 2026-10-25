import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SuperAdminAuthService } from '../super-admin/super-admin-auth.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginAttempts } from './login-attempts';

const PASSWORD = 'correct-password';
const BLOCK_MESSAGE = 'Too many failed attempts. Try again after 1 minute.';
const passwordHash = bcrypt.hashSync(PASSWORD, 4);
const features = {
  featLead: true,
  featReminder: true,
  featMeeting: true,
  featNote: true,
  featCalendar: true,
  featCustomer: true,
  featInvoice: true,
  featStaff: true,
  featLeave: true,
};
const admin = {
  id: 'admin-1',
  loginId: 'customer',
  name: 'Admin',
  passwordHash,
  status: 'ACTIVE',
  ...features,
};
const staff = {
  id: 'staff-1',
  adminId: admin.id,
  firstName: 'Staff',
  lastName: 'User',
  passwordHash,
  status: 'ACTIVE',
  email: 'staff@example.com',
};

describe.each(['admin', 'staff', 'super_admin'])(
  '%s login failed-attempt limit',
  (role) => {
    let login: (password: string, ip?: string) => Promise<unknown>;
    let signAsync: jest.Mock;

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      jest.setSystemTime(new Date('2026-10-25T00:00:00Z'));
      signAsync = jest.fn().mockResolvedValue('access-token');
      const jwt = { signAsync } as unknown as JwtService;
      const db = {
        admin: { findFirst: jest.fn().mockResolvedValue(admin) },
        staffMember: { findFirst: jest.fn().mockResolvedValue(staff) },
      };
      const auth = new AuthService(jwt, db as unknown as PrismaService);
      const controller = new AuthController(auth);
      const config = {
        get: (key: string) =>
          ({ SUPER_ADMIN_ID: 'owner', SUPER_ADMIN_PASSWORD: PASSWORD })[key],
      } as unknown as ConfigService;
      const superAdmin = new SuperAdminAuthService(config, jwt);
      login = (password, ip = '127.0.0.1') => {
        if (role === 'super_admin')
          return superAdmin.login({ id: 'owner', password }, ip);
        if (role === 'staff')
          return controller.staffLogin(
            { email: staff.email, password },
            { ip },
          );
        return controller.login({ id: admin.loginId, password }, { ip });
      };
    });

    afterEach(() => jest.useRealTimers());

    async function failFiveTimes() {
      for (let attempt = 1; attempt <= 4; attempt++) {
        await expect(login('wrong-password')).rejects.toBeInstanceOf(
          UnauthorizedException,
        );
      }
      await expect(login('wrong-password')).rejects.toMatchObject({
        status: 429,
        message: BLOCK_MESSAGE,
      });
    }

    it('blocks on the fifth failure, rejects even correct credentials, and allows login at exactly 60 seconds', async () => {
      await failFiveTimes();
      await expect(login(PASSWORD)).rejects.toMatchObject({
        status: 429,
        message: BLOCK_MESSAGE,
      });
      jest.advanceTimersByTime(59999);
      await expect(login(PASSWORD)).rejects.toMatchObject({ status: 429 });
      expect(signAsync).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      await expect(login(PASSWORD)).resolves.toMatchObject({
        accessToken: 'access-token',
      });
    });

    it('starts the one-minute block from the fifth failure rather than the first', async () => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        await expect(login('wrong-password')).rejects.toBeInstanceOf(
          UnauthorizedException,
        );
        jest.advanceTimersByTime(10000);
      }
      await expect(login('wrong-password')).rejects.toMatchObject({
        status: 429,
      });
      jest.advanceTimersByTime(59999);
      await expect(login(PASSWORD)).rejects.toMatchObject({ status: 429 });
      jest.advanceTimersByTime(1);
      await expect(login(PASSWORD)).resolves.toMatchObject({
        accessToken: 'access-token',
      });
    });

    it('resets the failure count after a successful login', async () => {
      for (let attempt = 1; attempt <= 4; attempt++)
        await expect(login('wrong-password')).rejects.toBeInstanceOf(
          UnauthorizedException,
        );
      await expect(login(PASSWORD)).resolves.toMatchObject({
        accessToken: 'access-token',
      });
      await failFiveTimes();
    });

    it('does not block another IP address', async () => {
      await failFiveTimes();
      await expect(login(PASSWORD, '127.0.0.2')).resolves.toMatchObject({
        accessToken: 'access-token',
      });
      await expect(login(PASSWORD)).rejects.toMatchObject({ status: 429 });
    });
  },
);

describe('fixed login cooldown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
  });
  afterEach(() => jest.useRealTimers());

  it('does not extend the block when an earlier in-flight failed request finishes', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 4; i++) attempts.recordFailure('admin:ip');
    expect(() => attempts.recordFailure('admin:ip')).toThrow(HttpException);
    jest.advanceTimersByTime(59000);
    expect(() => attempts.recordFailure('admin:ip')).toThrow(BLOCK_MESSAGE);
    jest.advanceTimersByTime(1000);
    expect(() => attempts.assertAllowed('admin:ip')).not.toThrow();
    expect(() => attempts.recordFailure('admin:ip')).not.toThrow();
  });

  it('keeps the Admin and Staff counters separate on the same IP', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 4; i++) attempts.recordFailure('admin:ip');
    expect(() => attempts.recordFailure('admin:ip')).toThrow(HttpException);
    expect(() => attempts.assertAllowed('staff:ip')).not.toThrow();
  });
});
