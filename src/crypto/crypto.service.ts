import { Injectable, NotFoundException, ConflictException, Inject, BadRequestException } from '@nestjs/common';
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
import { from, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LOG_LEVEL } from 'src/shared/enums/log';

@Injectable()
export class CryptoService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly cronService: CronService,
        private readonly instrumentDataService: InstrumentDataService,
        private readonly movingAverageCalcService: MovingAverageCalcService,
    ) {  }

    /**
     * Pulls data for a given symbol and calculates moving averages.
     * 
     * @param {string} symbol - The symbol to pull data for.
     * @returns {Observable<void>} An observable that completes when the job is done.
     */
    pullSymbolJob(symbol: string): Observable<void> {
        return from(this.instrumentDataService.pullData(symbol)).pipe(
            switchMap(() => this.movingAverageCalcService.calculateMovingaveragesForPair({
                base: symbol,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }))
        );
    }

   

    /**
     * Starts a cron job for a given symbol and interval.
     * 
     * @param {string} symbol - The symbol to start the cron job for.
     * @param {string} intervalCron - The cron interval.
     * @returns {void}
     */
    startCronJob(symbol: string, intervalCron: string): Observable<any> {
        const jobId = `${symbol}-${intervalCron}`;
        if(this.cronService.isCronJobRunning(jobId) === true) {
            this.logger.error(`Cron job already running for symbol ${symbol}`);
            throw new BadRequestException('Cron job already running');
        }
        
        return from(this.instrumentDataService.isPairRegistered(symbol)).pipe(
            switchMap(isRegistered => {
                if (!isRegistered) {
                    this.logger.error(`Pair not registered: ${symbol}`);
                    throw new BadRequestException('Pair not registered');
                }
                this.cronService.startCronJob(
                    jobId, 
                    () => {
                        this.pullSymbolJob(symbol).pipe(
                            catchError((error) => {
                                this.stopCronJob(symbol, intervalCron);
                                this.logger.error('Error pulling symbol data self-destructing cron job', { error });
                                return of();
                            })
                        ).subscribe();
                    },
                    intervalCron
                );
                return of("Cron job started");
            }),
            catchError(error => {
                this.logger.error(`Error starting cron job for symbol ${symbol}: ${error.message}`);
                throw error; // Rethrow the error to propagate it
            })
        );
    }

    /**
     * Stops a cron job for a given symbol and interval.
     * 
     * @param {string} symbol - The symbol to stop the cron job for.
     * @param {string} intervalCron - The cron interval.
     * @returns {void}
     */
    stopCronJob(symbol: string, intervalCron: string): void {
        const jobId = `${symbol}-${intervalCron}`;
        this.cronService.stopCronJob(jobId);
    }
}