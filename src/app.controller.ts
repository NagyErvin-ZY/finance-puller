import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { API_DESCRIPTION } from './shared/constants/api-description.const';
import { polygonClient, restClient, websocketClient } from "polygon.io";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOkResponse({ description: 'Api description' })
  @Get()
  getWhoami() {
    return API_DESCRIPTION
  }

  @Get('test')
  async test () {
        
    const rest = restClient("qttY5bXj3W7yntFXKUR0h95wDYgfBsAn");

    // you can use the api now

    return await rest.stocks.previousClose("AAPL")
  }

}