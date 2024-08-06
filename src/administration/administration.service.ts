import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import Pair from 'src/entities/pair.entity';

@Injectable()
export class AdministrationService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        @InjectRepository(Pair)
        private pairRepository: Repository<Pair>,
    ) {}

    registerPair(base: string, quote: string) {
        this.logger.log("info",'Starting registerPair process', { base, quote });

        const newPair = this.pairRepository.create({ base, quote });

        return from(this.pairRepository.save(newPair)).pipe(
            tap(() => this.logger.log("info",'Pair successfully registered', { base, quote })),
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