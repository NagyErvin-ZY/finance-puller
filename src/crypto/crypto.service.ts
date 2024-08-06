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
import { Repository } from 'typeorm';

@Injectable()
export class CryptoService {
    private jobs: Map<string, CronJob> = new Map();
    constructor(
        private configService: ConfigService,
        private schedulerRegistry: SchedulerRegistry,
        @InjectRepository(Pair)
        private pairRepository: Repository<Pair>,
        @InjectRepository(PairTickData)
        private pairTickDataRepository: Repository<PairTickData>
    ) { 
    }


    pullData = async (symbol: string) => {
        try {
            // Fetch data from the API
            const result = await axios.post(`${this.configService.get('thirdParty.liveCoinWatch.apiUrl')}/coins/single`, {
                currency: this.configService.get('thirdParty.liveCoinWatch.currency'),
                code: symbol
            }, {
                headers: {
                    'x-api-key': this.configService.get('thirdParty.liveCoinWatch.apiKey')
                }
            });
    
            const data = result.data;
    
            // Use a transaction to ensure atomicity
            await this.pairRepository.manager.transaction(async transactionalEntityManager => {
          
                // Create a PairTickData entity
                const pairTickData = {
                    pair_id: `${symbol.toLowerCase()}${this.configService.get('thirdParty.liveCoinWatch.currency').toLowerCase()}`,
                    order_type: ORDER_TYPE.NONE_MARKET_FETCH_LATEST_EXECUTION,
                    price: data.rate,
                    quantity: data.volume,
                    timestamp: new Date()
                };
    
                // Save the PairTickData entity to a dynamically named table
                const tableName = `pair_tick_data_${symbol.toLowerCase()}${this.configService.get('thirdParty.liveCoinWatch.currency').toLowerCase()}`;
                await transactionalEntityManager.createQueryBuilder()
                    .insert()
                    .into(tableName)
                    .values(pairTickData)
                    .execute();
            });
        } catch (error) {
            console.error(`Error pulling data for symbol ${symbol}:`, error);
        }
    }

    startCronJob(symbol: string, intervalCron: string) {
        const jobId = `${symbol}-${intervalCron}`;
        if (this.jobs.has(jobId)) {
            throw new ConflictException(`Job for ${symbol} with interval ${intervalCron} is already running`);
        }

        const job = new CronJob(intervalCron, async () => {
            await this.pullData(symbol);
        });

        this.schedulerRegistry.addCronJob(jobId, job);
        job.start();
        this.jobs.set(jobId, job);
    }

    stopCronJob(symbol: string, intervalCron: string) {
        const jobId = `${symbol}-${intervalCron}`;
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new NotFoundException(`Job for ${symbol} with interval ${intervalCron} not found`);
        }

        job.stop();
        this.schedulerRegistry.deleteCronJob(jobId);
        this.jobs.delete(jobId);
    }

    getAllRunningJobs() {
        return Array.from(this.jobs.keys());
    }
}