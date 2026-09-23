import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArcjetModule } from './lib/security/arcjet.module';
import { PrismaModule } from './lib/database/prisma.module';
import { ArcjetMiddleware } from './common/middleware/arcjet.middleware';

@Module({
  imports: [PrismaModule, ArcjetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ArcjetMiddleware).forRoutes('*');
  }
}
