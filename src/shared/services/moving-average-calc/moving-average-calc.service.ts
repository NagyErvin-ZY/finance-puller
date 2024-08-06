import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PairTickData from 'src/entities/pair-tick-data.entity';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { Repository } from 'typeorm';
import { InstrumentDataService } from '../instrument-data/instrument-data.service';
import { from, Observable } from 'rxjs';
import { Logger } from 'winston';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LOG_LEVEL } from 'src/shared/enums/log';

@Injectable()
export class MovingAverageCalcService {

    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>,
        @InjectRepository(PairTickData)
        private readonly pairTickDataRepository: Repository<PairTickData>,
        @InjectRepository(RegisteredMovingAverage)
        private readonly registeredMovingAverageRepository: Repository<RegisteredMovingAverage>,
        private readonly stockDataService: InstrumentDataService
    ) { }
    
    /**
     * Calculates moving averages for a given pair.
     * @param {Pair} pair - The pair entity.
     * @returns {Observable<void>} - An observable that completes when the moving averages are calculated.
     */
    calculateMovingaveragesForPair(pair: Pair): Observable<void> {
        return from((async () => {
            this.logger.log(LOG_LEVEL.INFO,`Calculating moving averages for pair ${pair.base}/${pair.quote}`);
            try {
                const registeredMovingAverages = await this.registeredMovingAverageRepository.find({
                    where: {
                        pair
                    }
                });

                for (const registeredMovingAverage of registeredMovingAverages) {
                    this.logger.log(LOG_LEVEL.INFO,`Fetching latest ${registeredMovingAverage.period} prices for moving average calculation`);
                    const prices = await this.stockDataService.getLatestNPricesForPair(pair, registeredMovingAverage.period);
                    this.logger.log(LOG_LEVEL.INFO,`Fetched prices: ${JSON.stringify(prices)}`);
                    const movingAverage = this.calculateMovingAverage(prices, registeredMovingAverage.period);

                    if (movingAverage === null) {
                        this.logger.warn(`Not enough prices to calculate moving average for period ${registeredMovingAverage.period}`);
                        continue;
                    }
                    await this.insertMovingAverage(pair, registeredMovingAverage.period, movingAverage);
                }
            } catch (error) {
                this.logger.error(`Error calculating moving averages for pair ${pair.base}/${pair.quote}: ${error.message}`);
                throw error;
            }
        })());
    }

    /**
     * Inserts a moving average into the database.
     * @param {Pair} pair - The pair entity.
     * @param {number} period - The period of the moving average.
     * @param {number} movingAverage - The calculated moving average.
     * @returns {Promise<void>} - A promise that resolves when the moving average is inserted.
     */
    private async insertMovingAverage(pair: Pair, period: number, movingAverage: number): Promise<void> {
        const tableName = `moving_average_${pair.base}${pair.quote}_${period}`;
        this.logger.log(LOG_LEVEL.INFO,`Inserting moving average into table ${tableName}: ${movingAverage}`);
        try {
            await this.pairRepository.query(`
                INSERT INTO ${tableName} (moving_average, timestamp) VALUES (${movingAverage}, NOW())
            `);
            this.logger.log(LOG_LEVEL.INFO,`Successfully inserted moving average for pair ${pair.base}/${pair.quote} and period ${period}`);
        } catch (error) {
            this.logger.error(`Error inserting moving average for pair ${pair.base}/${pair.quote} and period ${period}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calculates the moving average for a given set of prices.
     * @param {number[]} prices - The array of prices.
     * @param {number} period - The period of the moving average.
     * @returns {number | null} - The calculated moving average or null if there are not enough prices.
     */
    private calculateMovingAverage(prices: number[], period: number): number | null {
        if (prices.length < period) {
            this.logger.warn(`Not enough prices to calculate moving average. Required: ${period}, Available: ${prices.length}`);
            return null;
        }
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        const movingAverage = sum / period;
        this.logger.log(LOG_LEVEL.INFO,`Calculated moving average: ${movingAverage} for period: ${period}`);
        
        return movingAverage;
    }
}