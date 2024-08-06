import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MovingAverageService {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(RegisteredMovingAverage)
        private readonly registeredMovingAverageRepository: Repository<RegisteredMovingAverage>,
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>
    ) {
        
    }

    private createMovingAverageTable(base: string, quote: string, period: number) {
        //Table has base qute moving_average cols
        //Table name is moving_average_{base}{quote}_table
        const tableName = `moving_average_${base}${quote}_${period}`;
        return this.pairRepository.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id SERIAL PRIMARY KEY,
                moving_average DECIMAL,
                timestamp TIMESTAMP
            )
        `);
    }

    //Retursn latest moving average for pair and period

    getMovingAverage(base: string, period: number) {
        return this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        }).then(async pair => {
            if (!pair) {
                throw new Error('Pair not found');
            }
            const tableName = `moving_average_${pair.base}${pair.quote}_${period}`;
            return this.pairRepository.query(`
                SELECT moving_average FROM ${tableName} ORDER BY timestamp DESC LIMIT 1
            `).then((res: { moving_average: number }[]) => {
                if (res.length === 0) {
                    return null;
                }
                return res[0].moving_average;
            });
        });
    }
        
    registerMovingAverage(base: string, period: number) {
        return this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        }).then(async pair => {
            if (!pair) {
                throw new Error('Pair not found');
            }
            await this.createMovingAverageTable(pair.base, pair.quote, period);
            const newRegisteredMovingAverage = this.registeredMovingAverageRepository.create({ pair, period });
            return this.registeredMovingAverageRepository.save(newRegisteredMovingAverage);
        });
    }
}
