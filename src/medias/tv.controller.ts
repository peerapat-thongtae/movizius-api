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

@Controller('tv')
export class TVController {
  constructor(private readonly mediasService: MediasService) {}

  // @Post()
  // create(@Body() createMediaDto: CreateMediaDto) {
  //   return this.mediasService.create(createMediaDto);
  // }
}
