import { Module } from '@nestjs/common';
import { MovingAverageService } from './moving-average.service';
import { MovingAverageController } from './moving-average.controller';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Pair, RegisteredMovingAverage])],
    providers: [MovingAverageService, ConfigService],
    controllers: [MovingAverageController]
})
export class MovingAverageModule { }
