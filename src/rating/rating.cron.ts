import { Inject, Injectable } from '@nestjs/common';
import { RatingService } from '../rating/rating.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RatingCronJob {
  constructor(
    @Inject(RatingService)
    private ratingService: RatingService,
  ) {}

  @Cron('25 21 * * *')
  async updateIMDBDetail() {
    return this.ratingService.updateIMDBDetail();
  }
}
