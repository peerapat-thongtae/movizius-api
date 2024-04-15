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
    console.log('yes');
    return this.mediasService.getAllImdbRatings();
  }

  @Get('/imdb/:id')
  getImdbRating(@Param('id') id: string) {
    return this.mediasService.getImdbRating(id);
  }

  @Get('/update')
  updateIMDBDetail() {
    return this.mediasService.updateIMDBDetail();
  }
}
