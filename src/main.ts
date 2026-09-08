import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

const RUTA_DOCS = '/docs';

const DESCRIPCION = `
Entrenador de atajos de teclado. **La API corrige, el cliente solo envia teclas.**

### Como se usa, en orden

1. \`POST /auth/register\` o \`POST /auth/login\` -> te devuelve \`accessToken\` y \`refreshToken\`.
2. Pega el \`accessToken\` en el boton **Authorize** de arriba. Todo lo demas lo pide.
3. \`GET /tools\` -> que programas hay para entrenar (\`vscode\`, \`excel\`, ...).
4. \`GET /shortcuts/random?tool=vscode\` -> te da un atajo con su \`id\` y su \`description\`.
5. El usuario aprieta teclas. Mandas \`POST /attempts\` con ese \`shortcutId\` y las teclas.
   La API responde si estuvo bien. **Nunca mandes vos el resultado.**
6. \`GET /stats/me\` -> como viene rindiendo.

### Cuando el accessToken vence (15 min)

\`POST /auth/refresh\` con el \`refreshToken\` en el body -> par de tokens nuevo.

### Como se escriben las teclas

Array de strings, un elemento por tecla: \`["Control", "Shift", "P"]\`.
El orden no importa, la API normaliza antes de comparar.
`;

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
  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Shortcuts Trainer API')
    .setDescription(DESCRIPCION)
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Registro, login, refresh y datos de la sesion actual.')
    .addTag('tools', 'Catalogo de programas sobre los que se entrena.')
    .addTag(
      'shortcuts',
      'Atajos: los globales del catalogo y los tuyos propios.',
    )
    .addTag(
      'attempts',
      'Enviar intentos y ver el historial. Aca la API corrige.',
    )
    .addTag('stats', 'Metricas de rendimiento del usuario logueado.')
    .build();

  const documento = SwaggerModule.createDocument(app, config);
  app.use(RUTA_DOCS, apiReference({ content: documento }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
