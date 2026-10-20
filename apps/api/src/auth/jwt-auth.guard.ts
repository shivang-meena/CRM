import { ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ACCESS_POLICY, assertPermissions } from './permissions';
import type { AccessPolicy, AuthenticatedUser } from './permissions';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    if (!authenticated) return false;

    const user = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user;
    if (user.role === 'admin') return true;

    const policy = this.reflector.getAllAndOverride<AccessPolicy>(ACCESS_POLICY, [
      context.getHandler(), context.getClass(),
    ]);
    // Unclassified endpoints fail closed for staff.
    if (!policy || policy.adminOnly) {
      throw new ForbiddenException('Only an administrator can perform this action.');
    }
    assertPermissions(user, ...policy.permissions);
    return true;
  }
}
