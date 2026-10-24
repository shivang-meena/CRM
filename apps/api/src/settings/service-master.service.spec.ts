import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Reflector } from '@nestjs/core';
import { runWithTenant } from '../tenant/tenant-context';
import { ACCESS_POLICY } from '../auth/permissions';
import { CrmCoreService } from '../crm/crm-core.service';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { UpdateLeadDto } from '../leads/dto/update-lead.dto';
import { LeadsController } from '../leads/leads.controller';
import { LeadsService } from '../leads/leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceMasterController } from './service-master.controller';
import { SaveServiceMasterDto } from './service-master.dto';
import { ServiceMasterService } from './service-master.service';

describe('Services master and lead selection', () => {
  const serviceId = '48e1c712-1c93-42ef-938d-77e102fc6071';
  const service = {
    id: serviceId,
    name: 'Website Development',
    isActive: true,
  };
  const actor = { id: 'admin', name: 'Admin' };
  const lead = {
    id: 'lead-1',
    name: 'Customer',
    phone: '1234567890',
    status: 'NEW',
    estimatedAmount: 0,
    serviceId,
    service,
    version: 1,
  };
  const db = {
    serviceMaster: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const core = { history: jest.fn(), lockLead: jest.fn(), version: jest.fn() };
  const prisma = db as unknown as PrismaService;
  const masters = new ServiceMasterService(prisma);
  const leads = new LeadsService(prisma, core as unknown as CrmCoreService);

  beforeEach(() => {
    jest.resetAllMocks();
    db.$transaction.mockImplementation((callback: (tx: typeof db) => unknown) =>
      callback(db),
    );
    db.serviceMaster.findFirst.mockResolvedValue(service);
    db.lead.create.mockResolvedValue(lead);
    db.lead.update.mockResolvedValue({
      ...lead,
      service: undefined,
      version: 2,
    });
    db.lead.findUniqueOrThrow.mockResolvedValue({ ...lead, version: 2 });
    core.lockLead.mockResolvedValue(lead);
  });

  it('normalizes names and rejects blank, long, and invalid service input', async () => {
    const dto = plainToInstance(SaveServiceMasterDto, {
      name: ' Website   Development ',
    });
    expect(dto.name).toBe('Website Development');
    expect(await validate(dto)).toHaveLength(0);
    await runWithTenant('test-admin', () => masters.save(dto));
    expect(db.serviceMaster.create).toHaveBeenCalledWith({
      data: {
        name: 'Website Development',
        normalizedName: 'website development',
        isActive: undefined,
        adminId: 'test-admin',
      },
    });
    for (const input of [
      { name: '   ' },
      { name: 'a'.repeat(151) },
      { name: 123 },
      { name: 'SEO', isActive: 'true' },
    ]) {
      expect(
        (await validate(plainToInstance(SaveServiceMasterDto, input))).length,
      ).toBeGreaterThan(0);
    }
  });

  it('reports duplicate names instead of creating duplicate choices', async () => {
    db.serviceMaster.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate name', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );
    await expect(
      runWithTenant('test-admin', () =>
        masters.save({ name: 'website development' }),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('allows administrators to manage services and lead users to read choices', () => {
    const reflector = new Reflector();
    expect(reflector.get(ACCESS_POLICY, ServiceMasterController)).toEqual({
      permissions: [],
      adminOnly: true,
    });
    expect(reflector.get(ACCESS_POLICY, LeadsController)).toEqual({
      permissions: ['lead'],
    });
  });

  it('only exposes active services to the lead dropdown', async () => {
    await leads.listServices();
    expect(db.serviceMaster.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it('saves the selected service on a new lead', async () => {
    const saved = await runWithTenant('test-admin', () =>
      leads.create(
        { name: 'Customer', phone: '1234567890', serviceId },
        actor,
      ),
    );
    expect(saved.serviceId).toBe(serviceId);
    expect(db.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceId, adminId: 'test-admin' }) as unknown,
        include: { service: true },
      }),
    );
  });

  it('rejects unknown and inactive selections before creating or updating a lead', async () => {
    db.serviceMaster.findFirst.mockResolvedValue(null);
    await expect(
      runWithTenant('test-admin', () =>
        leads.create({ name: 'Customer', phone: '1234567890', serviceId }, actor),
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      leads.update(
        lead.id,
        { version: 1, serviceId: 'different-service' },
        actor,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(db.lead.create).not.toHaveBeenCalled();
    expect(db.lead.update).not.toHaveBeenCalled();
  });

  it('allows editing a lead while retaining a now-inactive service', async () => {
    db.serviceMaster.findFirst.mockResolvedValue(null);
    await leads.update(
      lead.id,
      { version: 1, serviceId, comment: 'Updated details' },
      actor,
    );
    expect(db.serviceMaster.findFirst).not.toHaveBeenCalled();
    expect(db.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceId,
          comment: 'Updated details',
        }) as unknown,
      }),
    );
  });

  it('allows leads without a service and explicitly clearing a saved service', async () => {
    await runWithTenant('test-admin', () =>
      leads.create({ name: 'Customer', phone: '1234567890' }, actor),
    );
    await leads.update(lead.id, { version: 1, serviceId: null }, actor);
    expect(db.serviceMaster.findFirst).not.toHaveBeenCalled();
    expect(db.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceId: null }) as unknown,
      }),
    );
    for (const serviceId of [undefined, null, service.id]) {
      expect(
        await validate(
          plainToInstance(CreateLeadDto, {
            name: 'Customer',
            phone: '1234567890',
            serviceId,
          }),
        ),
      ).toHaveLength(0);
      expect(
        await validate(
          plainToInstance(UpdateLeadDto, { version: 1, serviceId }),
        ),
      ).toHaveLength(0);
    }
    expect(
      (
        await validate(
          plainToInstance(CreateLeadDto, {
            name: 'Customer',
            phone: '1234567890',
            serviceId: 'invalid',
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it('saves merged service with HSN and validates GST formula', async () => {
    const validDto = plainToInstance(SaveServiceMasterDto, {
      name: 'Web Design',
      hsnSac: '998311',
      description: 'Web development services',
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
    });
    expect(await validate(validDto)).toHaveLength(0);
    db.serviceMaster.create.mockResolvedValueOnce({
      id: 'srv-1',
      name: 'Web Design',
      hsnSac: '998311',
      description: 'Web development services',
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      isActive: true,
    });
    const res = await runWithTenant('test-admin', () => masters.save(validDto));
    expect(res.igstRate).toBe(18);
    expect(res.cgstRate).toBe(9);
    expect(res.sgstRate).toBe(9);

    const invalidDto = plainToInstance(SaveServiceMasterDto, {
      name: 'Web Design',
      hsnSac: '998311',
      igstRate: 18,
      cgstRate: 8,
      sgstRate: 8, // 8+8 != 18
    });
    await expect(
      runWithTenant('test-admin', () => masters.save(invalidDto)),
    ).rejects.toThrow(BadRequestException);
  });
});
