import { Controller, Get, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PairRegisterDto } from './dto/pair-register.dto';
import { AdministrationService } from './administration.service';

@Controller('administration')
export class AdministrationController {
    constructor(
        private readonly administrationService: AdministrationService
    ) {}

    @Put()
    @ApiOperation({ summary: 'Register a new tradable pair like EUR/USD or BTC/USD or APPLE/USD' })
    @ApiResponse({ status: 200, description: 'Pair registered' })
    registerPair(@Query() query: PairRegisterDto) {
        return this.administrationService.registerPair(query.base, query.quote);
    }

    @Get()
    @ApiOperation({ summary: 'Get all registered pairs' })
    @ApiResponse({ status: 200, description: 'All registered pairs' })
    getAllPairs() {
        return this.administrationService.getAllPairs();
    }
}
