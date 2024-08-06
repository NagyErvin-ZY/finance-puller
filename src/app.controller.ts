import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { API_DESCRIPTION } from './shared/constants/api-description.const';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOkResponse({ description: 'Api description' })
  @Get()
  getWhoami() {
    return API_DESCRIPTION
  }
}