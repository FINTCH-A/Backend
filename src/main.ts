import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
  VersioningType,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  const config  = app.get(ConfigService);
  const port    = config.get<number>('PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  // ─── Seguridad ────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ─────────────────────────────────────────────────────
  app.enableCors({
    origin:      config.get<string>('CORS_ORIGIN', '*'),
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ─── Prefix global ────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Validación global ────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:             true,
      forbidNonWhitelisted:  true,
      transform:             true,
      transformOptions:      { enableImplicitConversion: true },
    }),
  );

  // ─── Filtros globales ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Interceptores globales ───────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ResponseInterceptor(reflector),
    new ClassSerializerInterceptor(reflector),
  );

  // ─── Swagger ──────────────────────────────────────────────────
  const swaggerEnabled = config.get<string>('SWAGGER_ENABLED', 'true') === 'true';

  if (swaggerEnabled && nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AvanteCreditos API')
      .setDescription(
        `## API REST para plataforma de préstamos digitales\n
        **Entorno:** ${nodeEnv}\n
        **Versión:** 1.0.0`,
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          name:         'Authorization',
          description:  'Ingresa tu JWT access token',
          in:           'header',
        },
        'access-token',
      )
      .addTag('Auth',            'Autenticación y autorización')
      .addTag('Users',           'Gestión de usuarios')
      .addTag('Address',         'Dirección del usuario')
      .addTag('KYC',             'Verificación de identidad')
      .addTag('Financial Info',  'Información financiera')
      .addTag('Family Info',     'Información familiar')
      .addTag('Payment Methods', 'Métodos de pago')
      .addTag('Loan Application','Solicitudes de préstamo')
      .addTag('Loans',           'Préstamos activos')
      .addTag('Installments',    'Cuotas de préstamo')
      .addTag('Payments',        'Pagos realizados')
      .addTag('Transactions',    'Transacciones externas')
      .addTag('Credit Score',    'Evaluación crediticia')
      .addTag('Risk Assessment', 'Evaluación de riesgo')
      .addTag('Ledger',          'Libro contable')
      .addTag('Notifications',   'Notificaciones')
      .addTag('Webhooks',        'Eventos externos')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'api/docs');

    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter:           'alpha',
        operationsSorter:     'alpha',
      },
    });

    Logger.log(
      `Swagger disponible en: http://localhost:${port}/${swaggerPath}`,
      'Bootstrap',
    );
  }

  await app.listen(port);
  Logger.log(
    `Servidor corriendo en: http://localhost:${port}/api/v1`,
    'Bootstrap',
  );
  Logger.log(`Entorno: ${nodeEnv}`, 'Bootstrap');
}

bootstrap();
