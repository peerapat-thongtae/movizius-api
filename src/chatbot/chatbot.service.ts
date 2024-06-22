import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { WebhookClient } from 'dialogflow-fulfillment';
import { MediasService } from '../medias/medias.service';
import { TMDBService } from '../medias/tmdb.service';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class ChatbotService {
  constructor(
    // @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    // @InjectModel(TV.name) private tvModel: Model<TVDocument>,
    private readonly httpService: HttpService,
    private tmdbService: TMDBService,
    // @Inject(forwardRef(() => MediasService))
    private mediaService: MediasService,
  ) {}
  initFulfillment(request: Request, response: Response) {
    const agent = new WebhookClient({ request, response });
    return agent;
  }

  async getMediaAccountState({ media_type, total, userId }) {
    const medias = await this.mediaService.random(
      userId,
      media_type,
      total,
      'watchlist',
    );
    return medias.results.map((val) => `${val.name}`).join('\r\n');
  }
}
