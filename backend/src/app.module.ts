import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // 1. Inicializamos la lectura del archivo .env
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles en todo el proyecto
    }),

    // 2. Conexión asíncrona a PostgreSQL usando TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Obtenemos la URL de la nube si existe
        const databaseUrl = configService.get<string>('DATABASE_URL');

        return {
          type: 'postgres',
          // 1. Priorizamos la URL completa si estamos en Render/Neon
          url: databaseUrl,
          
          // 2. Fallback: Si no hay URL (en local), usamos las variables individuales
          host: configService.get<string>('POSTGRES_HOST'),
          port: configService.get<number>('POSTGRES_PORT') || 5432,
          username: configService.get<string>('POSTGRES_USER'),
          password: configService.get<string>('POSTGRES_PASSWORD'),
          database: configService.get<string>('POSTGRES_DB'),
          
          autoLoadEntities: true,
          synchronize: true, 
          
          // 3. SSL dinámico: Solo se activa si detectamos DATABASE_URL (entorno de nube)
          ssl: databaseUrl ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // 3. Conexión asíncrona a MongoDB usando Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    UsersModule,

    AuthModule,

    OrganizationsModule,

    ProjectsModule,

    TasksModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}