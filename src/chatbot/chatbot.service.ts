import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { WebhookClient } from 'dialogflow-fulfillment';
import { MediasService } from '../medias/medias.service';
import { TMDBService } from '../medias/tmdb.service';
import { HttpService } from '@nestjs/axios';
import { MovieService } from '../movie/movie.service';
import { sample, take } from 'lodash';
import { TvService } from '../tv/tv.service';
@Injectable()
export class ChatbotService {
  constructor(
    private readonly httpService: HttpService,
    private movieService: MovieService,
    private tvService: TvService,
  ) {}
  initFulfillment(request: Request, response: Response) {
    const agent = new WebhookClient({ request, response });
    return agent;
  }

  async getMediaAccountState({ media_type, total, userId }) {
    if (media_type === 'movie') {
      const movies = await this.movieService.getAllMovieStateByUser({
        user_id: userId,
      });

      const takeMovies = take(sample(movies), total);
      return takeMovies.map((val: any) => val.title).join(`\r\n`);
    } else if (media_type === 'tv') {
      const movies = await this.tvService.getAllStates({
        user_id: userId,
      });

      const takeMovies = take(sample(movies), total);
      return takeMovies.map((val: any) => val.name).join(`\r\n`);
    }
  }
}
