import { Controller, Get, Param } from '@nestjs/common';
import { RatingService } from './rating.service';

@Controller('v2/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get('')
  getRating() {
    return this.ratingService.findAll();
  }

  @Get('/update')
  update() {
    return this.ratingService.updateIMDBDetail();
  }
  @Get('/:id')
  getRatingById(@Param('id') id: string) {
    return this.ratingService.findByImdbId(id);
  }
}
