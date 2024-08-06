import { Controller, Param, Put, Query, Delete, Get } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StartFetchDto } from './dto/start-fetch.dto';
import { CryptoService } from './crypto.service';

@ApiTags('crypto')
@Controller('crypto')
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Put("/:symbol")
  @ApiOperation({ summary: 'Start fetching crypto data' })
  @ApiParam({ name: 'symbol', type: String, description: 'The crypto symbol to fetch data for' })
  @ApiQuery({ name: 'intervalCron', type: String, description: 'The interval at which to fetch the crypto data' })
  startFetchingcryptoData(
    @Param('symbol') symbol: string,
    @Query() { intervalCron }: StartFetchDto 
  ) {
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
    this.cryptoService.stopCronJob(symbol, intervalCron);
    return `Stopped fetching data for ${symbol} at interval ${intervalCron}`;
  }
}