import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const RUTA_DOCS = '/docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const casco = helmet();
  const cascoDocs = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Scalar sirve su bundle desde jsdelivr y el CSP estricto lo bloquearia.
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path.startsWith(RUTA_DOCS)
      ? cascoDocs(req, res, next)
      : casco(req, res, next),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? false,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Shortcuts Trainer API')
    .setDescription('Entrenador de atajos de teclado. La API corrige, el cliente solo envia teclas.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, config);
  app.use(RUTA_DOCS, apiReference({ content: documento }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
