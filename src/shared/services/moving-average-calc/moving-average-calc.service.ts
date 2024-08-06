import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PairTickData from 'src/entities/pair-tick-data.entity';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { Repository } from 'typeorm';
import { InstrumentDataService } from '../instrument-data/instrument-data.service';

@Injectable()
export class MovingAverageCalcService {

    constructor(
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>,
        @InjectRepository(PairTickData)
        private readonly pairTickDataRepository: Repository<PairTickData>,
        @InjectRepository(RegisteredMovingAverage)
        private readonly registeredMovingAverageRepository: Repository<RegisteredMovingAverage>,
        private readonly stockDataService: InstrumentDataService
    ) { }
    
    async calculateMovingaveragesForPair(pair: Pair) {
        //Get registered moving averages for pair
        const registeredMovingAverages = await this.registeredMovingAverageRepository.find({
            where:{
                pair
            }
        });

        for (const registeredMovingAverage of registeredMovingAverages) {
            //Get last N prices for pair
            const prices = await this.stockDataService.getLatestNPricesForPair(pair, registeredMovingAverage.period);
            console.log(prices);
            //Calculate moving average
            const movingAverage = this.calculateMovingAverage(prices, registeredMovingAverage.period);

            //If not enough prices to calculate moving average, skip
            if (movingAverage === null) continue;
            //Insert moving average into table
            await this.insertMovingAverage(pair, registeredMovingAverage.period, movingAverage);
        }
    }

    private insertMovingAverage(pair: Pair, period: number, movingAverage: number) {
        //Insert moving average into table
        const tableName = `moving_average_${pair.base}${pair.quote}_${period}`;
        return this.pairRepository.query(`
            INSERT INTO ${tableName} (moving_average, timestamp) VALUES (${movingAverage}, NOW())
        `);
    }

    private calculateMovingAverage(prices: number[], period: number): number {
        if (prices.length < period) {
            return null;
        }
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        console.log({ sum, period });
        
        return sum / period;
    }
}
