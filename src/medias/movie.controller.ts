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
import { TodoStatusEnum } from 'src/medias/enum/todo-status.enum';

@Controller('movie')
@UseGuards(AuthGuard('jwt'))
export class MovieController {
  private readonly mediaType = 'movie';
  constructor(private readonly mediasService: MediasService) {}

  @Post()
  create(@Body() createMediaDto: CreateMediaDto, @Req() req) {
    return this.mediasService.create(
      createMediaDto,
      this.mediaType,
      req.user?.sub,
    );
  }

  @Get()
  findAll(@Req() req) {
    return this.mediasService.findAll(req?.user?.sub, this.mediaType);
  }

  @Get('paginate/:status')
  paginate(@Param('status') status: TodoStatusEnum, @Req() req) {
    return this.mediasService.paginateMovieByStatus(
      req?.user?.sub,
      status,
      Number(req.query?.page),
    );
  }

  @Get('/random')
  random(@Req() req) {
    return this.mediasService.random(req?.user?.sub, this.mediaType);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.mediasService.findOne(id, req?.user?.sub, this.mediaType);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediasService.update(id, updateMediaDto, this.mediaType);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediasService.remove(id, this.mediaType);
  }
}
