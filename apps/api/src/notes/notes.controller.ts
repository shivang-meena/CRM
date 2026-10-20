import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/permissions';
import { Actor } from '../crm/crm-core.service';
import { CreateNoteDto, DeleteNoteDto, NoteQueryDto, UpdateNoteDto } from './dto/note.dto';
import { NotesService } from './notes.service';

@UseGuards(JwtAuthGuard)
@RequirePermissions('note')
@Controller('notes')
export class NotesController {
  constructor(private service: NotesService) {}

  @Get()
  list(@Query() query: NoteQueryDto, @Req() req: { user: Actor }) { return this.service.list(query, req.user); }

  @Post()
  create(@Body() body: CreateNoteDto, @Req() req: { user: Actor }) { return this.service.create(body, req.user); }

  @Get(':id')
  one(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: Actor }) { return this.service.one(id, req.user); }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateNoteDto, @Req() req: { user: Actor }) { return this.service.update(id, body, req.user); }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Body() body: DeleteNoteDto, @Req() req: { user: Actor }) { return this.service.remove(id, body.version, req.user); }
}
