import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminLoginIdDto } from './dto/super-admin.dto';
import { SuperAdminService } from './super-admin.service';

describe('Super Admin changes an Admin login ID', () => {
  const password = 'existing-password';
  const passwordHash = bcrypt.hashSync(password, 4);
  let admin: Admin;
  const db = { admin: { findFirst: jest.fn(), update: jest.fn() } };
  const prisma = db as unknown as PrismaService;
  const service = new SuperAdminService(prisma);
  const auth = new AuthService(
    {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as unknown as JwtService,
    prisma,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    admin = {
      id: 'admin-1',
      loginId: 'old-id',
      passwordHash,
      name: 'Customer',
      businessName: 'Business',
      phone: null,
      email: null,
      status: 'ACTIVE',
      blockedAt: null,
      deletedAt: null,
      featLead: true,
      featReminder: true,
      featMeeting: true,
      featNote: true,
      featCalendar: true,
      featCustomer: true,
      featInvoice: true,
      featStaff: true,
      featLeave: true,
      version: 1,
      createdAt: new Date('2026-10-25T00:00:00Z'),
      updatedAt: new Date('2026-10-25T00:00:00Z'),
    };
    db.admin.findFirst.mockImplementation(
      ({ where }: { where: Prisma.AdminWhereInput }) => {
        if (typeof where.id === 'string')
          return Promise.resolve(where.id === admin.id ? admin : null);
        return Promise.resolve(
          where.loginId === admin.loginId && !where.id ? admin : null,
        );
      },
    );
    db.admin.update.mockImplementation(
      ({ data }: { data: { loginId: string } }) => {
        admin = { ...admin, loginId: data.loginId, version: admin.version + 1 };
        return Promise.resolve(admin);
      },
    );
  });

  it('normalizes the ID and lets the same account log in with the new ID and existing password', async () => {
    const updated = await service.changeLoginId(admin.id, {
      loginId: '  New.Customer_01  ',
    });
    expect(updated).toMatchObject({
      id: 'admin-1',
      loginId: 'new.customer_01',
      version: 2,
    });
    expect(updated).not.toHaveProperty('passwordHash');
    expect(admin.passwordHash).toBe(passwordHash);
    expect(db.admin.update).toHaveBeenCalledWith({
      where: { id: admin.id },
      data: { loginId: 'new.customer_01', version: { increment: 1 } },
    });
    await expect(auth.login({ id: 'old-id', password })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      auth.login({ id: 'New.Customer_01', password }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: { id: admin.id, role: 'admin' },
    });
  });

  it('rejects an ID already assigned to another Admin', async () => {
    db.admin.findFirst
      .mockResolvedValueOnce(admin)
      .mockResolvedValueOnce({ ...admin, id: 'admin-2', loginId: 'taken' });
    await expect(
      service.changeLoginId(admin.id, { loginId: 'TAKEN' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.admin.update).not.toHaveBeenCalled();
    expect(admin.loginId).toBe('old-id');
  });

  it('reports a concurrent database uniqueness conflict without exposing a server error', async () => {
    db.admin.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['loginId'] },
      }),
    );
    await expect(
      service.changeLoginId(admin.id, { loginId: 'taken' }),
    ).rejects.toThrow('This Login ID is already used. Choose another.');
    expect(admin.loginId).toBe('old-id');
  });

  it('rejects a missing Admin without updating records', async () => {
    await expect(
      service.changeLoginId('missing', { loginId: 'new-id' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(db.admin.update).not.toHaveBeenCalled();
  });

  it.each(['', 'ab', 'a'.repeat(51), 'contains space', 'invalid@email', null])(
    'rejects invalid ID %p at the API boundary',
    async (loginId) => {
      const errors = await validate(
        plainToInstance(UpdateAdminLoginIdDto, { loginId }),
      );
      expect(errors.some((error) => error.property === 'loginId')).toBe(true);
    },
  );

  it('accepts the same valid ID characters as Admin creation', async () => {
    expect(
      await validate(
        plainToInstance(UpdateAdminLoginIdDto, {
          loginId: 'Customer.01_new-id',
        }),
      ),
    ).toHaveLength(0);
  });
});
