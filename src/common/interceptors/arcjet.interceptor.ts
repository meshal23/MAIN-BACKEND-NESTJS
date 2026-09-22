import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  ForbiddenException,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { ArcjetService } from '../../lib/security/arcjet.service';

/**
 * Interceptor for protecting individual routes with Arcjet.
 * Use @ArcjetProtect() decorator on route handlers that need custom protection.
 */
@Injectable()
export class ArcjetInterceptor implements NestInterceptor {
  constructor(private readonly arcjet: ArcjetService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const decision = await this.arcjet.protect(request);

    if (decision.isDenied()) {
      throw new ForbiddenException({
        message: 'Request blocked by security rules',
        reason: decision.reason,
      });
    }

    return next.handle();
  }
}
