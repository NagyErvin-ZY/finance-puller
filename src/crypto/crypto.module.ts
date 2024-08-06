import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import Pair from 'src/entities/pair.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import PairTickData from 'src/entities/pair-tick-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pair,PairTickData]),
    ScheduleModule.forRoot()
  ],
  providers: [CryptoService,ConfigService],
  controllers: [CryptoController]
})
export class CryptoModule {}
