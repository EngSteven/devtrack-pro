import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuramos CORS para que acepte localhost (desarrollo) y URL de Vercel (producción)
  const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL, 
  ].filter(Boolean); // Filtramos nulos por si acaso

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Render asigna dinámicamente el PORT, en tu PC usará el 3000
  await app.listen(process.env.PORT || 3000);
}
bootstrap();