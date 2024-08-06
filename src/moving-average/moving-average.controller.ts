import { Controller, Post, Body, Put, Query, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MovingAverageService } from './moving-average.service';

@Controller('moving-average')
export class MovingAverageController {
  constructor(
    private readonly configService: ConfigService,
    private readonly movingAverageService: MovingAverageService,
) {}

  @Put("/:symbol")
  async registerMovingAverage(
    @Param('symbol') symbol: string,
    @Query('period') period: number,
  ) {
    return this.movingAverageService.registerMovingAverage(symbol, period);
  }

  @Get("/:symbol")
    async getMovingAverage(
        @Query('symbol') symbol: string,
        @Query('period') period: number,
    ) {
        return this.movingAverageService.getMovingAverage(symbol, period);
    }

}