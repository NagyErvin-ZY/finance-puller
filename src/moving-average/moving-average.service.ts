import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { Repository } from 'typeorm';
import { from, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

@Injectable()
export class MovingAverageService {
    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(RegisteredMovingAverage)
        private readonly registeredMovingAverageRepository: Repository<RegisteredMovingAverage>,
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>
    ) {}

    /**
     * Creates a moving average table for the given base and quote currencies and period.
     * @param {string} base - The base currency.
     * @param {string} quote - The quote currency.
     * @param {number} period - The period for the moving average.
     * @returns {Promise<void>}
     */
    private createMovingAverageTable(base: string, quote: string, period: number) {
        const tableName = `moving_average_${base}${quote}_${period}`;
        return this.pairRepository.query(`
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id SERIAL PRIMARY KEY,
                moving_average DECIMAL,
                timestamp TIMESTAMP
            )
        `);
    }


    /**
     * Returns the latest moving average for the given base currency and period.
     * @param {string} base - The base currency.
     * @param {number} period - The period for the moving average.
     * @returns {Observable<number | null>}
     */
    getMovingAverage(base: string, period: number) {
        return from(this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        })).pipe(
            switchMap(pair => {
                if (!pair) {
                    throw new Error('Pair not found');
                }
                const tableName = `moving_average_${pair.base}${pair.quote}_${period}`;
                return from(this.pairRepository.query(`
                    SELECT moving_average, timestamp FROM ${tableName} ORDER BY timestamp DESC LIMIT 1
                `)).pipe(
                    map((res: { moving_average: number, timestamp: number }[]) => {
                        if (res.length === 0) {
                            return null;
                        }
                        return {
                            timestamp: res[0].timestamp,
                            movingAverage: res[0].moving_average
                        };
                    })
                );
            }),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }

    /**
     * Registers a moving average for the given base currency and period.
     * @param {string} base - The base currency.
     * @param {number} period - The period for the moving average.
     * @returns {Observable<RegisteredMovingAverage>}
     */
    registerMovingAverage(base: string, period: number) {
        return from(this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        })).pipe(
            switchMap(async pair => {
                if (!pair) {
                    throw new Error('Pair not found');
                }
                await this.createMovingAverageTable(pair.base, pair.quote, period);
                const newRegisteredMovingAverage = this.registeredMovingAverageRepository.create({ pair, period });
                return from(this.registeredMovingAverageRepository.save(newRegisteredMovingAverage));
            }),
            catchError(err => {
                console.error(err);
                return of(null);
            })
        );
    }
}