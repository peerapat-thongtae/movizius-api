import { Inject, Injectable } from '@nestjs/common';
import { RatingService } from '../rating/rating.service';
import { Cron } from '@nestjs/schedule';
import { LineService } from '../line/line.service';

@Injectable()
export class RatingCronJob {
  constructor(
    @Inject(RatingService)
    private ratingService: RatingService,

    @Inject(LineService)
    private lineService: LineService,
  ) {}

  // @Cron('25 21 * * *')
  async updateIMDBDetail() {
    try {
      return this.ratingService.updateIMDBDetail();
      // await this.lineService.pushMessage(process.env.DEV_LINE_USER_ID, {
      //   type: 'text',
      //   text: 'Updated IMDB Success',
      // });
    } catch (err) {
      return err;
    }
  }
}
