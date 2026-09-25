import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArcjetModule } from './lib/security/arcjet.module';
import { PrismaModule } from './lib/database/prisma.module';
import { ArcjetMiddleware } from './common/middleware/arcjet.middleware';
import { auth } from './lib/auth';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    PrismaModule,
    ArcjetModule,
    AuthModule.forRoot({ auth }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ArcjetMiddleware).forRoutes('*');
  }
}
