import { WebhookRequestBody } from '@line/bot-sdk';
import { Body, Controller, Post } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export default class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post('webhook')
  async webhook(@Body() body: WebhookRequestBody) {
    try {
      this.lineService.handleEvents(body.events);
    } catch (err) {
      // console.log(err);
    }
  }
}
