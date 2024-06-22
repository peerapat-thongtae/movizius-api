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
  Query,
} from '@nestjs/common';
import { MediasService } from './medias.service';
import { CreateMediaDto, UpdateTVEpisodeDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { AuthGuard } from '@nestjs/passport';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';

@Controller('tv')
@UseGuards(AuthGuard('jwt'))
export class TVController {
  private readonly mediaType = 'tv';
  constructor(private readonly mediasService: MediasService) {}

  @Post()
  create(@Body() createMediaDto: CreateMediaDto, @Req() req) {
    return this.mediasService.create(
      createMediaDto,
      this.mediaType,
      req.user?.sub,
    );
  }

  @Post('episodes')
  updateEpisodeWatched(@Body() createMediaDto: UpdateTVEpisodeDto, @Req() req) {
    return this.mediasService.updateTVEpisodes(createMediaDto, req.user?.sub);
  }

  @Get()
  findAll(@Req() req) {
    return this.mediasService.findAll(req?.user?.sub, this.mediaType);
  }

  @Get('paginate/:status')
  paginate(
    @Query('page') page: number,
    @Param('status') status: TodoStatusEnum,
    @Req() req,
  ) {
    return this.mediasService.paginateTVByStatus({
      userId: req?.user?.sub,
      status,
      page,
    });
  }

  @Get('test')
  async test(@Query('page') page: number, @Req() req) {
    return this.mediasService.updatetest();
    const a = await this.mediasService.findAll(req.user?.sub, 'tv');
    return a.results.map((val) => ({ name: val.name, id: val.id }));
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
