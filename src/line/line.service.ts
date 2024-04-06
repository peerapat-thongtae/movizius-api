import { EventMessage, Message, WebhookEvent } from '@line/bot-sdk';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { slice } from 'lodash';
import { MediaTypeEnum } from '../medias/enum/media-type.enum';
import { MediasService } from '../medias/medias.service';
import { TMDBService } from '../medias/tmdb.service';
import dayjs from 'dayjs';
// import { TodoStatus } from 'todos/enum/todo-status.enum';
// import { TodosService } from 'todos/todos.service';
import { carouselMessage, IMovieLineCard } from './helpers/line-flex.helper';
import LineClient from './line.config';

@Injectable()
export class LineService {
  private replyToken = '';
  private client = new LineClient({
    channelAccessToken: this.configService.get('LINE_CHANNEL_ACCESS_TOKEN'),
    channelSecret: this.configService.get('LINE_CHANNEL_SECRET'),
  });
  constructor(
    private readonly configService: ConfigService,
    // private readonly tmdbService: TMDBService,
    // private readonly mediaService: MediasService,
    // private readonly todoService: TodosService,
    // @InjectQueue('lineNotiQueue') private lineNotiQueue: Queue,
  ) {}
  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async handleEvents(events: WebhookEvent[]) {
    const promises: readonly any[] = [];
    events.map((event: WebhookEvent) => {
      // switch (event.type) {
      //   case 'message': {
      //     this.replyToken = event.replyToken;
      //     this.handleEventMessage(event.message);
      //   }
      // }
    });
    return Promise.all(promises);
  }

  pushMessage(lineUserId: string, message: Message | Message[]) {
    if (!lineUserId) {
      return;
    }
    return this.client.pushMessage(lineUserId, message);
  }

  replyMessage(message: Message | Message[]) {
    try {
      return this.client.replyMessage(this.replyToken, message);
    } catch (err) {
      console.log(err);
    }
  }

  // @Cron('44 22 * * *')
  // async pushRandomTodo() {
  //   const todos = await this.todoService.randomTodosPaginate({
  //     page: 1,
  //     limit: 4,
  //     mediaType: MediaTypeEnum.MOVIE,
  //     status: TodoStatus.WATCHLIST,
  //   });
  //   const medias: IMovieLineCard[] = todos.results.map((media) => {
  //     return {
  //       id: media.id,
  //       mediaType: 'MOVIE',
  //       poster_path: media.poster_path,
  //       name: media.title,
  //       release_date: media.release_date,
  //       vote_average: media.vote_average,
  //       vote_count: media.vote_count,
  //       streamingName: '',
  //       note: '',
  //       watchUrl: 'http://localhost:3000/movie/' + media.id,
  //     } as IMovieLineCard;
  //   });
  //   try {
  //     const type: Message = {
  //       type: 'flex',
  //       altText: 'random movie watchlist',
  //       contents: carouselMessage(medias),
  //     };
  //     await this.pushMessage(type);
  //   } catch (err) {
  //     console.log('err : ', JSON.stringify(err));
  //   }
  // }

  test(lineUserId: string) {
    console.log('line user', lineUserId);
    return this.pushMessage(lineUserId, { type: 'text', text: 'test' });
  }
}
