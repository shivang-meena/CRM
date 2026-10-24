import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedUser } from '../auth/permissions';

@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ok = await super.canActivate(context);
    if (!ok) return false;
    const user = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;
    if (user.role !== 'super_admin') throw new ForbiddenException('Super admin access only.');
    return true;
  }
}
