import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentAdminId } from '../tenant/tenant-context';

type Assignment = { assignedTo: string; assignedToId: string | null };
type AssignmentInput = { assignedTo?: string | null; assignedToId?: string | null };

@Injectable()
export class AssigneesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(db: Prisma.TransactionClient = this.prisma) {
    const adminId = currentAdminId();
    const [admin, staff] = await Promise.all([
      db.admin.findFirst({ where: { id: adminId, deletedAt: null }, select: { id: true, name: true } }),
      db.staffMember.findMany({
        where: { adminId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
      }),
    ]);
    if (!admin) throw new NotFoundException('Admin not found');
    return [
      { ...admin, role: 'admin' as const, email: null, employeeCode: null },
      ...staff.map(row => ({
        id: row.id, name: `${row.firstName} ${row.lastName}`.trim(),
        role: 'staff' as const, email: row.email, employeeCode: row.employeeCode,
      })),
    ];
  }

  async resolve(db: Prisma.TransactionClient, input: AssignmentInput, actor: { id: string; name: string }, before?: Assignment): Promise<Assignment> {
    // Preserve historical assignments when an unrelated field is edited.
    if (before && (input.assignedToId === undefined || input.assignedToId === before.assignedToId) &&
      (input.assignedTo === undefined || input.assignedTo === before.assignedTo)) {
      return { assignedTo: before.assignedTo, assignedToId: before.assignedToId };
    }

    const options = await this.list(db);
    const name = input.assignedTo?.trim();
    const id = input.assignedToId || (!name || name === actor.name ? actor.id : undefined);
    const matches = id ? options.filter(option => option.id === id)
      : name ? options.filter(option => option.name === name)
      : options.filter(option => option.id === actor.id);
    if (matches.length !== 1) {
      throw new BadRequestException('Select this business’s Admin or a staff member from Assign To.');
    }
    return { assignedToId: matches[0].id, assignedTo: matches[0].name };
  }

  summary(before: Assignment, after: Assignment) {
    return before.assignedToId !== after.assignedToId || before.assignedTo !== after.assignedTo
      ? `Assigned from ${before.assignedTo || 'Unassigned'} to ${after.assignedTo}` : null;
  }
}
