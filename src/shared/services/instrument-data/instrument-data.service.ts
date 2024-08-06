import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { ORDER_TYPE } from 'src/entities/enums/pair-tick.enums';
import Pair from 'src/entities/pair.entity';
import { Repository } from 'typeorm';
import { catchError, from, map, mergeMap, Observable, of, switchMap } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LOG_LEVEL } from 'src/shared/enums/log';

@Injectable()
export class InstrumentDataService {

    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>,
        private readonly configService: ConfigService
    ) { }

    /**
     * Checks if a trading pair is registered in the repository.
     * 
     * @param {string} symbol - The symbol of the trading pair to check.
     * @returns {Observable<boolean>} An observable that emits true if the pair is registered, false otherwise.
     */
    isPairRegistered = (symbol: string): Observable<boolean> => {
        this.logger.log(LOG_LEVEL.INFO, `Checking if pair ${symbol}/${this.configService.get('thirdParty.liveCoinWatch.currency')} is registered`);
        return from(
            this.pairRepository.findOne({
                where: {
                    base: symbol,
                    quote: this.configService.get('thirdParty.liveCoinWatch.currency')
                }
            })
        ).pipe(
            map(pair => !!pair),
            catchError(error => {
                this.logger.error(`Error checking if pair ${symbol} is registered: ${error.message}`);
                return of(false); // Return false in case of error
            })
        );
    }

    /**
     * Gets the latest N prices for a given pair.
     * @param {Pair} pair - The pair entity.
     * @param {number} period - The number of latest prices to retrieve.
     * @returns {Promise<number[]>} - A promise that resolves to an array of prices.
     */
    getLatestNPricesForPair = async (pair: Pair, period: number): Promise<number[]> => {
        const tableName = `pair_tick_data_${pair.base}${pair.quote}`;
        this.logger.log(LOG_LEVEL.INFO, `Fetching latest ${period} prices for pair ${pair.base}/${pair.quote} from table ${tableName}`);
        try {
            const prices = await this.pairRepository.query(`
                SELECT price FROM ${tableName} ORDER BY timestamp DESC LIMIT ${period}
            `);
            this.logger.log(LOG_LEVEL.INFO, `Fetched prices: ${JSON.stringify(prices)}`);
            return prices.map(price => Number(price.price));
        } catch (error) {
            this.logger.error(`Error fetching prices for pair ${pair.base}/${pair.quote}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Pulls data for a given symbol from the API.
     * @param {string} symbol - The symbol to fetch data for.
     * @returns {Observable<void>} - An observable that completes when the data is pulled and stored.
     */

    pullData = (symbol: string): Observable<void> => {
        this.logger.log(LOG_LEVEL.INFO, `Pulling-storing data for symbol ${symbol}`);
        return from(
            axios.post(`${this.configService.get('thirdParty.liveCoinWatch.apiUrl')}/coins/single`, {
                currency: this.configService.get('thirdParty.liveCoinWatch.currency'),
                code: symbol
            }, {
                headers: {
                    'x-api-key': this.configService.get('thirdParty.liveCoinWatch.apiKey')
                }
            })
        ).pipe(
            map(result => result.data),
            mergeMap(data => {
                this.logger.log(LOG_LEVEL.INFO, `Pulled data for symbol ${symbol}: ${JSON.stringify(data)}`);
                return from(this.storePairTickData(symbol, data)).pipe(
                    catchError(storeError => {
                        this.logger.error(`Error storing data for symbol ${symbol}`, storeError);
                        //Propagate the error to self-destruct the cron job
                        throw storeError;
                    })
                );
            }),
            catchError(pullError => {
                this.logger.error(`Error pulling-storing data for symbol ${symbol}`, pullError.response.data);
                //Propagate the error to self-destruct the cron job
                throw pullError;
            })
        );
    }

    /**
     * Stores pair tick data in the database.
     * @param {string} symbol - The symbol of the pair.
     * @param {any} data - The data to store.
     * @returns {Promise<void>} - A promise that resolves when the data is stored.
     */
    storePairTickData = async (symbol: string, data: any): Promise<void> => {
        this.logger.log(LOG_LEVEL.INFO, `Storing pair tick data for symbol ${symbol}`);
        await this.pairRepository.manager.transaction(async transactionalEntityManager => {
            const pairTickData = {
                pair_id: `${symbol.toLowerCase()}${this.configService.get('thirdParty.liveCoinWatch.currency').toLowerCase()}`,
                order_type: ORDER_TYPE.NONE_MARKET_FETCH_LATEST_EXECUTION,
                price: data.rate,
                quantity: data.volume,
                timestamp: new Date()
            };

            const tableName = `pair_tick_data_${symbol.toLowerCase()}${this.configService.get('thirdParty.liveCoinWatch.currency').toLowerCase()}`;
            this.logger.log(LOG_LEVEL.INFO, `Inserting data into table ${tableName}: ${JSON.stringify(pairTickData)}`);
            try {
                await transactionalEntityManager.createQueryBuilder()
                    .insert()
                    .into(tableName)
                    .values(pairTickData)
                    .execute();
                this.logger.log(LOG_LEVEL.INFO, `Successfully stored pair tick data for symbol ${symbol}`);
            } catch (error) {
                this.logger.error(`Error storing pair tick data for symbol ${symbol}: ${error.message}`);
                throw error;
            }
        });
    }
}