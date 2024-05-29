import { Injectable } from '@nestjs/common';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { WebhookClient } from 'dialogflow-fulfillment';
@Injectable()
export class ChatbotService {
  initFulfillment(request: Request, response: Response) {
    const agent = new WebhookClient({ request, response });
    return agent;
  }
}
