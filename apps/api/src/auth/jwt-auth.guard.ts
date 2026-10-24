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

    // The Super Admin must never use normal CRM endpoints (they have their own /super-admin/* routes).
    if (user.role === 'super_admin') {
      throw new ForbiddenException('The super admin account cannot use CRM endpoints.');
    }

    const policy = this.reflector.getAllAndOverride<AccessPolicy>(ACCESS_POLICY, [
      context.getHandler(), context.getClass(),
    ]);

    if (user.role === 'admin') {
      // Admin: unclassified endpoints stay allowed (as before), but a classified endpoint
      // requires the module to be enabled for this Admin by the Super Admin.
      if (policy) assertPermissions(user, ...policy.permissions);
      return true;
    }

    // Staff: unclassified endpoints and admin-only endpoints fail closed.
    if (!policy || policy.adminOnly) {
      throw new ForbiddenException('Only an administrator can perform this action.');
    }
    assertPermissions(user, ...policy.permissions);
    return true;
  }
}
