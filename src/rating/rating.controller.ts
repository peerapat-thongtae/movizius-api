import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingCronJob } from '../rating/rating.cron';

@Controller('v2/rating')
export class RatingController {
  constructor(
    private readonly ratingService: RatingService,
    private readonly ratingCronService: RatingCronJob,
  ) {}

  @Get('')
  getRating() {
    return this.ratingService.findAll();
  }

  @Get('/update')
  update() {
    return this.ratingCronService.updateIMDBDetail();
  }
  @Get('/:id')
  getRatingById(@Param('id') id: string) {
    return this.ratingService.findByImdbId(id);
  }

  @Post()
  getRatings(@Body('ids') ids: string[]) {
    return this.ratingService.findByImdbIds(ids);
  }
}
