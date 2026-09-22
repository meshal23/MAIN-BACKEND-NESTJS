import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { ArcjetProtect } from './common/decorators/arcjet-protect.decorator';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  /**
   * Global middleware protects this route automatically.
   * No decorator needed unless you want extra protection.
   */
  @Get()
  getHello(): string {
    this.logger.log('GET / - Request passed Arcjet protection');
    return this.appService.getHello();
  }

  /**
   * Example: Add extra Arcjet protection to sensitive POST routes.
   * Useful for login, payment, or admin endpoints.
   */
  @Post('example')
  @ArcjetProtect()
  async exampleProtectedRoute(@Body() data: any): Promise<any> {
    this.logger.log('POST /example - Request passed both middleware and route interceptor');
    return { message: 'Success', data };
  }
}
