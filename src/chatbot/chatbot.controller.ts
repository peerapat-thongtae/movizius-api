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

  @Post('webhook')
  webhook(@Req() request, @Res() response) {
    const agent = this.chatbotService.initFulfillment(request, response);

    const welcome = () => {
      agent.add(agent.intent);
    };
    console.log('hooks', agent);
    console.log(agent.locale);
    console.log('agent');
    const intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    agent.locale;
    agent.handleRequest(intentMap);
    return 1;
  }
}
