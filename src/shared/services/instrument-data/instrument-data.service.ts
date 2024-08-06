import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { ORDER_TYPE } from 'src/entities/enums/pair-tick.enums';
import Pair from 'src/entities/pair.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InstrumentDataService {

    constructor(
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>,
        private readonly configService: ConfigService
    ) {}

    getLatestNPricesForPair = async (pair: Pair, period: number): Promise<number[]> => {
        // Get last N prices for pair
        const tableName = `pair_tick_data_${pair.base}${pair.quote}`;
        return this.pairRepository.query(`
            SELECT price FROM ${tableName} ORDER BY timestamp DESC LIMIT ${period}
        `).then((prices: { price: number }[]) => {
            return prices.map(price => Number(price.price));
        });
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
    
            // Store the data
            await this.storePairTickData(symbol, data);
            
        } catch (error) {
            console.error(`Error pulling data for symbol ${symbol}:`, error);
        }
    }

    storePairTickData = async (symbol: string, data: any) => {
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
    }
}
