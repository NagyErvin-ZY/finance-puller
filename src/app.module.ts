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
import { CryptoModule } from './crypto/crypto.module';
import { MovingAverageModule } from './moving-average/moving-average.module';
import { DatabaseInitService } from './database-init/database-init.service';
@Module({
  imports: [
    WinstonModule.forRoot(config().logging.winston),
    TypeOrmModule.forRoot({
      ...config().database as any,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    AppConfigModule,
    AdministrationModule,
    CryptoModule,
    MovingAverageModule
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
    DatabaseInitService,
    
  ],
})
export class AppModule {}
