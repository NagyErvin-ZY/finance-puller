import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import RegisteredMovingAverage from 'src/entities/registered-moving-average.entity';
import { Repository } from 'typeorm';
import { from, Observable, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Logger } from 'winston';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';

@Injectable()
export class MovingAverageService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        private readonly configService: ConfigService,
        @InjectRepository(RegisteredMovingAverage)
        private readonly registeredMovingAverageRepository: Repository<RegisteredMovingAverage>,
        @InjectRepository(Pair)
        private readonly pairRepository: Repository<Pair>,
        private readonly instrumentDataService: InstrumentDataService
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
        this.logger.log('info', `Getting moving average for ${base} with period ${period}`);
        return from(this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        })).pipe(
            switchMap(pair => {
                if (!pair) {
                    this.logger.error(`Pair not registered: ${base}`);
                    throw new BadRequestException('Pair not registered');
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
                    }),
                    catchError(err => {
                        this.logger.error(`Error getting moving average for ${base} with period ${period}`, err);
                        throw new BadRequestException(`Moving average not found for ${base} with period ${period}`);
                    })
                );
            }),
            catchError(err => {
                this.logger.error(`Error getting moving average for ${base} with period ${period}`, err);
                throw err;
            })

        );
    }

    isMovingAverageRegistered(base: string, period: number): Observable<boolean> {
        this.logger.log('info', `Checking if moving average is registered for ${base} with period ${period}`);
        return from(this.pairRepository.findOne({ 
            where: { 
                base: base,
                quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
            }
        })).pipe(
            switchMap(pair => {
                if (!pair) {
                    this.logger.error(`Pair not registered: ${base}`);
                    throw new BadRequestException('Pair not registered');
                }
                return from(this.registeredMovingAverageRepository.findOne({ 
                    where: { 
                        pair,
                        period
                    }
                })).pipe(
                    map(registeredMovingAverage => !!registeredMovingAverage)
                );
            }),
            catchError(err => {
                this.logger.error(`Error checking if moving average is registered for ${base} with period ${period}`, err);
                throw err;
            })
        );
    }

    /**
     * Registers a moving average for the given base currency and period.
     * @param {string} base - The base currency.
     * @param {number} period - The period for the moving average.
     * @returns {Observable<RegisteredMovingAverage>}
     */
    registerMovingAverage(base: string, period: number): Observable<RegisteredMovingAverage | any> {
        this.logger.log('info', `Registering moving average for ${base} with period ${period}`);

        //Check if the moving average is already registered
        return this.isMovingAverageRegistered(base, period).pipe(
            switchMap(isRegistered => {
                if (isRegistered) {
                    this.logger.error(`Moving average already registered for ${base} with period ${period}`);
                    throw new BadRequestException('Moving average already registered');
                }
                return from(this.pairRepository.findOne({ 
                    where: { 
                        base: base,
                        quote: this.configService.get<string>('thirdParty.liveCoinWatch.currency')
                    }
                }));
            }),
            switchMap(pair => {
                if (!pair) {
                    throw new Error('Pair not found');
                }
                return from(this.createMovingAverageTable(pair.base, pair.quote, period)).pipe(
                    switchMap(() => {
                        const newRegisteredMovingAverage = this.registeredMovingAverageRepository.create({ pair, period });
                        return from(this.registeredMovingAverageRepository.save(newRegisteredMovingAverage));
                    })
                );
            }),
            catchError(err => {
                this.logger.error(`Error registering moving average for ${base} with period ${period}`, err);
                throw err;
            })
        );
    }
}