import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error.code === 'P2002' || error.code === 'P2034' ? 409 : error.code === 'P2025' ? 404 : 500;
    const message = status === 409 ? 'This record conflicts with another change. Refresh and try again.'
      : status === 404 ? 'Record not found' : 'The record could not be saved.';
    if (status === 500) {
      const request = host.switchToHttp().getRequest<{ method: string; path: string }>();
      Logger.error({
        method: request.method,
        path: request.path,
        code: error.code,
        meta: error.meta,
      }, 'PrismaErrorFilter');
    }
    response.status(status).json({ statusCode: status, message });
  }
}
