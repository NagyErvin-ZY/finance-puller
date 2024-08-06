import { Module } from '@nestjs/common';
import { MovingAverageService } from './moving-average.service';
import { MovingAverageController } from './moving-average.controller';

@Module({
  providers: [MovingAverageService],
  controllers: [MovingAverageController]
})
export class MovingAverageModule {}
