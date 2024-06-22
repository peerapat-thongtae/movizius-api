import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MediasService } from './medias.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('rating')
export class RatingController {
  constructor(private readonly mediasService: MediasService) {}

  @Get('/imdb')
  getAll() {
    return this.mediasService.getAllImdbRatings();
  }

  @Post('/imdb')
  getImdbRatingByIds(@Body() body) {
    return this.mediasService.getImdbRatingByIds(body.ids);
  }

  @Get('/imdb/:id')
  getImdbRating(@Param('id') id: string) {
    return this.mediasService.getImdbRating(id);
  }
}
