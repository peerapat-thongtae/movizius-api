import { Controller, Get } from '@nestjs/common';
import { CronService } from './cron.service';
import { MovieService } from '../movie/movie.service';
import { TvService } from '../tv/tv.service';
import { MediasService } from '../medias/medias.service';
import { AuthService } from '../auth/auth.service';
import { LineService } from '../line/line.service';
import dayjs from 'dayjs';

@Controller('cron')
export class CronController {
  constructor(
    private readonly tvService: TvService,
    private readonly movieService: MovieService,
    private readonly mediaService: MediasService,
    private readonly authService: AuthService,
    private readonly lineService: LineService,
  ) {}

  @Get('/tv-air-today')
  async sendTVAirToday() {
    const users = await this.authService.findUserHasLineProvider();
    const todayShows = await this.mediaService.getTVAiringAll();

    for (const user of users) {
      const lineId = user.identities.find(
        (val) => val.provider === 'line',
      )?.user_id;

      if (lineId) {
        const findTVStates = await this.tvService.getAllStates({
          user_id: user.user_id,
        });

        const todayWithStates = todayShows.results.filter((val) =>
          findTVStates.map((val) => val.id).includes(val.id),
        );

        const promises = todayWithStates.map((val) =>
          this.mediaService.getTVInfo(val.id),
        );
        const todayDetailStates = await Promise.all(promises);

        let message = `TV Series or Anime Airing Today ${dayjs().format('DD/MM/YYYY')} : \r\n \r\n`;
        for (const tv of todayDetailStates) {
          message += `  -  ${tv.name} Season ${tv?.next_episode_to_air.season_number} EP. ${tv?.next_episode_to_air.episode_number}\r\n`;
        }

        await this.lineService.pushMessage(lineId, {
          type: 'text',
          text: message,
        });
        return todayDetailStates;
      }
    }
    return todayShows.results.map((val) => val.name);
  }

  @Get('/movie-air-today')
  async sendMovieAirToday() {
    const users = await this.authService.findUserHasLineProvider();
    const todayShows = await this.mediaService.getMovieByDate();

    for (const user of users) {
      const lineId = user.identities.find(
        (val) => val.provider === 'line',
      )?.user_id;

      if (lineId) {
        const findMovieStates = await this.movieService.getAllMovieStateByUser({
          user_id: user.user_id,
        });

        const todayWithStates = todayShows.results.filter((val) =>
          findMovieStates.map((val) => val.id).includes(val.id),
        );

        const promises = todayWithStates.map((val) =>
          this.mediaService.getMovieInfo(val.id),
        );
        const todayDetailStates = await Promise.all(promises);

        if (todayDetailStates.length === 0) {
          return todayDetailStates;
        }
        let message = `Movies Airing Today ${dayjs().format('DD/MM/YYYY')} : \r\n \r\n`;
        for (const movie of todayDetailStates) {
          message += `  -  ${movie.title} \r\n`;
        }

        await this.lineService.pushMessage(lineId, {
          type: 'text',
          text: message,
        });
        return todayDetailStates;
      }
    }
    return todayShows.results.map((val) => val.title);
  }
}
