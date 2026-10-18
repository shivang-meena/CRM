import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Note, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor, CrmCoreService } from '../crm/crm-core.service';
import { CreateNoteDto, NoteQueryDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService, private core: CrmCoreService) {}

  private format(note: Note) {
    return { ...note, type: 'Note' as const };
  }

  private where(query: NoteQueryDto, actor: Actor): Prisma.NoteWhereInput {
    const search = query.search?.trim();
    return {
      createdById: actor.id,
      deletedAt: null,
      ...(search ? { content: { contains: search, mode: 'insensitive' } } : {}),
    };
  }

  private content(value: string) {
    const content = value.trim();
    if (!content) throw new BadRequestException('Note content is required.');
    return content;
  }

  async list(query: NoteQueryDto, actor: Actor) {
    const where = this.where(query, actor);
    const [rows, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.note.count({ where }),
    ]);
    return { items: rows.map(row => this.format(row)), total, page: query.page, pageSize: query.pageSize };
  }

  async one(id: string, actor: Actor) {
    const note = await this.prisma.note.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found.');
    return this.format(note);
  }

  async create(input: CreateNoteDto, actor: Actor) {
    const content = this.content(input.content);
    const requestHash = this.core.hash({ content });
    return this.prisma.$transaction(async tx => {
      const existing = await tx.note.findFirst({ where: { createdById: actor.id, requestKey: input.requestKey } });
      if (existing) {
        this.core.replay(existing, requestHash);
        return this.format(existing);
      }
      const note = await tx.note.create({ data: {
        content,
        createdById: actor.id,
        createdByName: actor.name,
        requestKey: input.requestKey,
        requestHash,
      } });
      return this.format(note);
    });
  }

  async update(id: string, input: UpdateNoteDto, actor: Actor) {
    const content = this.content(input.content);
    return this.prisma.$transaction(async tx => {
      const before = await tx.note.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
      if (!before) throw new NotFoundException('Note not found.');
      this.core.version(before, input.version);
      const note = await tx.note.update({ where: { id }, data: { content, version: { increment: 1 } } });
      return this.format(note);
    });
  }

  async remove(id: string, version: number, actor: Actor) {
    return this.prisma.$transaction(async tx => {
      const before = await tx.note.findFirst({ where: { id, createdById: actor.id, deletedAt: null } });
      if (!before) throw new NotFoundException('Note not found.');
      this.core.version(before, version);
      await tx.note.update({ where: { id }, data: { deletedAt: new Date(), version: { increment: 1 } } });
      return { success: true };
    });
  }
}
