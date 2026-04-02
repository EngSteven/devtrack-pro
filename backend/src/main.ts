import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Filtra las propiedades que no estén definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extra (seguridad extra)
      transform: true, // Transforma automáticamente los tipos de datos (ej. string a number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
