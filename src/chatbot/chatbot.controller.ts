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
import { AuthService } from 'src/auth/auth.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly authService: AuthService,
  ) {}

  @Post('webhook')
  webhook(@Req() request, @Res() response) {
    const agent = this.chatbotService.initFulfillment(request, response);
    const intentName = agent.intent;
    const param = agent.parameters;
    const intentMap = new Map();

    const originalReq: any = agent.originalRequest;
    // console.log(typeof agent.requestSource);
    const welcome = async () => {
      if (param.media_type) {
        const lineId: string = originalReq.payload.data?.source?.userId;
        const userId = await this.authService.findByLineId(lineId);
        const msg = await this.chatbotService.getMediaAccountState({
          media_type: param.media_type,
          total: param['number-integer'],
          userId: userId,
        });
        agent.add(msg);
      }
    };

    if (intentName === 'Get Media Account state') {
      intentMap.set('Get Media Account state', async () => await welcome());
    }

    if (intentMap.size > 0) {
      agent.handleRequest(intentMap);
    }
  }
}
