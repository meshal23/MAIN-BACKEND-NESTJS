import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable trust proxy so Express correctly identifies client IP
  // This is required for Arcjet to properly track rate limits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
