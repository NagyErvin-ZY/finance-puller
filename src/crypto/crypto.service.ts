import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CronJob } from 'cron';
import { IRestClient, restClient } from 'polygon.io';
import { ORDER_TYPE } from 'src/entities/enums/pair-tick.enums';
import PairTickData from 'src/entities/pair-tick-data.entity';
import Pair from 'src/entities/pair.entity';
import { MovingAverageCalcService } from 'src/shared/services/moving-average-calc/moving-average-calc.service';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';
import { Repository } from 'typeorm';
import { CronService } from 'src/shared/services/cron/cron.service';

@Injectable()
export class CryptoService {
    constructor(
        private readonly configService: ConfigService,
        private readonly cronService: CronService,
        private readonly instrumentDataService: InstrumentDataService,
        private readonly movingAverageCalcService: MovingAverageCalcService,
    ) {  }

    async pullSymbolJob(symbol: string) {
        await this.instrumentDataService.pullData(symbol);
        await this.movingAverageCalcService.calculateMovingaveragesForPair({
            base: symbol,
            quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
        });
    }
        

    startCronJob(
        symbol: string,
        intervalCron: string
    ) {
        const jobId = `${symbol}-${intervalCron}`;
        this.cronService.startCronJob(
            jobId, 
            async () => await this.pullSymbolJob(symbol),
            intervalCron
        );
    }

    stopCronJob(symbol: string, intervalCron: string) {
        const jobId = `${symbol}-${intervalCron}`;
        this.cronService.stopCronJob(jobId);
    }

}