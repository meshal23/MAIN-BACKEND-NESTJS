import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false /* needed for nestJS better-auth implementation */,
  });

  // Enable trust proxy so Express correctly identifies client IP
  // This is required for Arcjet to properly track rate limits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
