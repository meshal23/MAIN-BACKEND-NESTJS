import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ArcjetInterceptor } from '../interceptors/arcjet.interceptor';

/**
 * Decorator for protecting individual route handlers with Arcjet.
 * Apply to POST, PUT, DELETE routes or sensitive GET endpoints.
 *
 * @example
 * @Post('auth/login')
 * @ArcjetProtect()
 * async login(@Body() credentials: LoginDto) {
 *   // Your route logic
 * }
 */
export function ArcjetProtect() {
  return applyDecorators(UseInterceptors(ArcjetInterceptor));
}
