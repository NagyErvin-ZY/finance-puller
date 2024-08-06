import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CryptoController } from './crypto.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import Pair from 'src/entities/pair.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import PairTickData from 'src/entities/pair-tick-data.entity';
import { MovingAverageCalcService } from 'src/shared/services/moving-average-calc/moving-average-calc.service';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { CronService } from 'src/shared/services/cron/cron.service';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pair,PairTickData,RegisteredMovingAverage]),
    ScheduleModule.forRoot()
  ],
  providers: [CryptoService,ConfigService,MovingAverageCalcService,CronService,InstrumentDataService],
  controllers: [CryptoController]
})
export class CryptoModule {}
