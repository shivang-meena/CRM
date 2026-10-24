import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../auth/permissions';
import { tenantStorage } from './tenant-context';

/**
 * Runs the whole controller call inside the tenant context of the logged-in Admin/Staff.
 * Guards run BEFORE interceptors, so `req.user` is already set here.
 * Requests without a tenant (login, super-admin) simply continue without context.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const adminId = req.user?.adminId;
    if (!adminId) return next.handle();
    return new Observable((subscriber) => {
      tenantStorage.run({ adminId, system: false }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
