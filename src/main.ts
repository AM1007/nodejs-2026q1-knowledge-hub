import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CustomLogger } from './common/custom-logger';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(new CustomLogger());
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub')
    .setDescription('Knowledge Hub API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const server = app.getHttpServer();

  process.on('uncaughtException', async (error) => {
    const logger = app.get(CustomLogger);
    logger.error(`Uncaught Exception: ${error.message}`, error.stack);

    const prisma = app.get(PrismaService);
    await prisma.$disconnect();

    server.close(() => {
      process.exit(1);
    });
  });

  process.on('unhandledRejection', async (reason: any) => {
    const logger = app.get(CustomLogger);
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logger.error(`Unhandled Rejection: ${message}`, stack);

    server.close(() => {
      process.exit(1);
    });
  });
}
bootstrap();
