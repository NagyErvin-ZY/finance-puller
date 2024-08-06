import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import Pair from 'src/entities/pair.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdministrationService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        @InjectRepository(Pair)
        private pairRepository: Repository<Pair>,
        private configService: ConfigService
    ) {}

    registerPair(base: string) {
        const quote = this.configService.get<string>('thirdParty.liveCoinWatch.currency');
        this.logger.log("info", 'Starting registerPair process', { base, quote });
    
        const newPair = this.pairRepository.create({ base, quote });
    
        return from(this.pairRepository.save(newPair)).pipe(
            tap(async () => {
                this.logger.log("info", 'Pair successfully registered', { base, quote });
    
                // Create a new table dynamically named based on the pair
                const tableName = `pair_tick_data_${base.toLowerCase()}${quote.toLowerCase()}`;
                await this.pairRepository.query(`
                    CREATE TABLE IF NOT EXISTS ${tableName} (
                        id SERIAL PRIMARY KEY,
                        pair_id VARCHAR(255) NOT NULL,
                        order_type VARCHAR(255),
                        price DECIMAL,
                        quantity DECIMAL,
                        timestamp TIMESTAMP
                    )
                `);
            }),
            map(() => 'Pair registered'),
            catchError((error) => {
                this.logger.error('Error registering pair', { error });
                throw error;
            })
        );
    }

    getAllPairs() {
        this.logger.log("info",'Starting getAllPairs process');

        return from(this.pairRepository.find()).pipe(
            tap((pairs) => this.logger.log("info",'Pairs successfully retrieved', { pairs })),
            catchError((error) => {
                this.logger.error('Error retrieving pairs', { error });
                throw error;
            })
        );
    }
}