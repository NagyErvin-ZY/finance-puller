import { Controller, Get, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PairRegisterDto } from './dto/pair-register.dto';
import { AdministrationService } from './administration.service';
import { ConfigService } from '@nestjs/config';

@Controller('administration')
export class AdministrationController {
    constructor(
        private readonly configService: ConfigService,
        private readonly administrationService: AdministrationService
    ) {}

    @Put()
    @ApiOperation({ summary: 'Register a new tradable pair like EUR or BTC or APPLE' })
    @ApiResponse({ status: 200, description: 'Pair registered' })
    registerPair(@Query() query: PairRegisterDto) {
        return this.administrationService.registerPair(query.base);
    }

    @Get()
    @ApiOperation({ summary: 'Get all registered pairs' })
    @ApiResponse({ status: 200, description: 'All registered pairs' })
    getAllPairs() {
        return this.administrationService.getAllPairs();
    }

}
