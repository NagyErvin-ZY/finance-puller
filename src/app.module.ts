import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { WinstonModule } from 'nest-winston';
import config from './config/config';

@Module({
  imports: [
    WinstonModule.forRoot(config().logging.winston),
    AppConfigModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
