import { Controller, Get, Inject, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PairRegisterDto } from './dto/pair-register.dto';
import { AdministrationService } from './administration.service';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { LOG_LEVEL } from 'src/shared/enums/log';

@Controller('administration')
export class AdministrationController {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
        private readonly configService: ConfigService,
        private readonly administrationService: AdministrationService
    ) {}

    @Put()
    @ApiOperation({ summary: 'Register a new tradable pair like EUR or BTC or APPLE' })
    @ApiQuery({ name: 'base', description: 'The base currency of the pair', type: String })
    @ApiResponse({ status: 200, description: 'Pair registered' })
    registerPair(@Query() query: PairRegisterDto) {
        this.logger.log(LOG_LEVEL.INFO, 'Registering pair', query);
        return this.administrationService.registerPair(query.base);
    }

    @Get()
    @ApiOperation({ summary: 'Get all registered pairs' })
    @ApiResponse({ status: 200, description: 'All registered pairs' })
    getAllPairs() {
        this.logger.log(LOG_LEVEL.INFO, 'Getting all pairs');
        return this.administrationService.getAllPairs();
    }

}
