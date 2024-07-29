import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { WebhookClient } from 'dialogflow-fulfillment';
import { MediasService } from '../medias/medias.service';
import { TMDBService } from '../medias/tmdb.service';
import { HttpService } from '@nestjs/axios';
import { MovieService } from '../movie/movie.service';
@Injectable()
export class ChatbotService {
  constructor(
    private readonly httpService: HttpService,
    private movieService: MovieService,
  ) {}
  initFulfillment(request: Request, response: Response) {
    const agent = new WebhookClient({ request, response });
    return agent;
  }

  async getMediaAccountState({ media_type, total, userId }) {
    return [];
  }
}
