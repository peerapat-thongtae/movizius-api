import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('webhook')
  webhook(@Req() request, @Res() response) {
    console.log('hooks');
    const agent = this.chatbotService.initFulfillment(request, response);
    console.log('agent', agent);
    return 1;
  }
}
