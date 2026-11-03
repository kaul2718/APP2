import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const allowedOrigins: (string | RegExp)[] = [
    'https://elhospitaldelcomputador.com',
    'https://www.elhospitaldelcomputador.com',
    'http://localhost:3000',
    'http://localhost:4000',
  ];
  if (process.env.FRONTEND_URL) {
    try {
      const parsed = new URL(process.env.FRONTEND_URL).origin;
      if (!allowedOrigins.includes(parsed)) {
        allowedOrigins.push(parsed);
      }
    } catch {
      if (!allowedOrigins.includes(process.env.FRONTEND_URL)) {
        allowedOrigins.push(process.env.FRONTEND_URL);
      }
    }
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permite solicitudes sin header Origin (llamadas internas, healthchecks, curl)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) =>
        typeof allowed === 'string' ? allowed === origin : allowed.test(origin),
      );
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Servicio Tecnico')
    .setDescription('Documentacion OpenAPI del backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`Servidor escuchando en http://localhost:${port}`);
  logger.log(`Swagger disponible en http://localhost:${port}/api/docs`);
}
bootstrap();