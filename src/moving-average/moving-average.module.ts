import { Module } from '@nestjs/common';
import { MovingAverageService } from './moving-average.service';
import { MovingAverageController } from './moving-average.controller';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';

@Module({
    imports: [TypeOrmModule.forFeature([Pair, RegisteredMovingAverage])],
    providers: [MovingAverageService, ConfigService,InstrumentDataService],
    controllers: [MovingAverageController]
})
export class MovingAverageModule { }
