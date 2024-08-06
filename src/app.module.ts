import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { WinstonModule } from 'nest-winston';
import { AdministrationModule } from './administration/administration.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import config from './config/config';
import Pair from './entities/pair.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './shared/interceptors/logger-interceptor';
import { ResponseFormatInterceptor } from './shared/interceptors/response-formatter.interceptor';
@Module({
  imports: [
    WinstonModule.forRoot(config().logging.winston),
    TypeOrmModule.forRoot({
      ...config().database as any,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    AppConfigModule,
    AdministrationModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseFormatInterceptor
    },
  ],
})
export class AppModule {}
