import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false /* needed for nestJS better-auth implementation */,
  });

  // 2. Skip json parsing for /api/auth/* routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth/')) return next();
    json()(req, res, next);
  });

  // 3. Skip urlencoded parsing for /api/auth/* routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth/')) return next();
    urlencoded({ extended: true })(req, res, next);
  });

  // Enable trust proxy so Express correctly identifies client IP
  // This is required for Arcjet to properly track rate limits
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // Register global response interceptor
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
