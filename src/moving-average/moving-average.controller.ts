import { Controller, Post, Body, Put, Query, Get, Param } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MovingAverageService } from './moving-average.service';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';
import { lastValueFrom } from 'rxjs';

@ApiTags('moving-average')
@Controller('moving-average')
export class MovingAverageController {
    constructor(
        private readonly configService: ConfigService,
        private readonly movingAverageService: MovingAverageService,
        private readonly instrumentDataService: InstrumentDataService,
    ) { }

    @Put("/:symbol")
    @ApiOperation({ summary: 'Register a moving average for a symbol' })
    @ApiParam({ name: 'symbol', description: 'The symbol to register the moving average for', type: String })
    @ApiQuery({ name: 'period', description: 'The period for the moving average', type: Number })
    @ApiResponse({ status: 200, description: 'The moving average has been successfully registered.' })
    async registerMovingAverage(
        @Param('symbol') symbol: string,
        @Query('period') period: number,
    ) {
        return this.movingAverageService.registerMovingAverage(symbol, period);
    }

    @Get("/:symbol")
    @ApiOperation({ summary: 'Get the moving average for a symbol' })
    @ApiQuery({ name: 'symbol', description: 'The symbol to get the moving average for', type: String })
    @ApiQuery({ name: 'period', description: 'The period for the moving average', type: Number })
    @ApiResponse({ status: 200, description: 'The moving average data.' })
    async getMovingAverage(
        @Param('symbol') symbol: string,
        @Query('period') period: number,
    ) {
        const average = await lastValueFrom(this.movingAverageService.getMovingAverage(symbol, period));
        const [price] = await this.instrumentDataService.getLatestNPricesForPair({
            base: symbol,
            quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
        }, 1);

        return { ...average, price };
    }
}