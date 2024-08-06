import { Controller, Param, Put, Query, Delete, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StartFetchDto } from './dto/start-fetch.dto';
import { CryptoService } from './crypto.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LOG_LEVEL } from 'src/shared/enums/log';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly cryptoService: CryptoService
  ) {}

  @Put("/:symbol")
  @ApiOperation({ summary: 'Start fetching crypto data' })
  @ApiParam({ name: 'symbol', type: String, description: 'The crypto symbol to fetch data for' })
  @ApiQuery({ name: 'intervalCron', type: String, description: 'The interval at which to fetch the crypto data' })
  startFetchingcryptoData(
    @Param('symbol') symbol: string,
    @Query() { intervalCron }: StartFetchDto 
  ) {
    this.logger.log(LOG_LEVEL.INFO, 'Starting to fetch crypto data', { symbol, intervalCron });
    this.cryptoService.startCronJob(symbol, intervalCron);
    return `Started fetching data for ${symbol} at interval ${intervalCron}`;
  }

  @Delete("/:symbol")
  @ApiOperation({ summary: 'Stop fetching crypto data' })
  @ApiParam({ name: 'symbol', type: String, description: 'The crypto symbol to stop fetching data for' })
  @ApiQuery({ name: 'intervalCron', type: String, description: 'The interval at which to stop fetching the crypto data' })
  stopFetchingcryptoData(
    @Param('symbol') symbol: string,
    @Query() { intervalCron }: StartFetchDto 
  ) {
    this.logger.log(LOG_LEVEL.INFO, 'Stopping to fetch crypto data', { symbol, intervalCron });
    this.cryptoService.stopCronJob(symbol, intervalCron);
    return `Stopped fetching data for ${symbol} at interval ${intervalCron}`;
  }
}