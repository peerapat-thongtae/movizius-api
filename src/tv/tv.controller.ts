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
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { TvService } from './tv.service';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { CreateTvDto, UpdateTVEpisodeDto } from '../tv/dto/create-tv.dto';
import { ceil } from 'lodash';
import { DiscoverTvRequest } from 'moviedb-promise';
import { MediasService } from '../medias/medias.service';
import { SortType } from '../tv/types/TV.type';

@Controller('v2/tv')
@UsePipes(new ValidationPipe({ transform: true }))
export class TvController {
  constructor(
    private readonly tvService: TvService,
    private readonly mediaService: MediasService,
  ) {}
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getAllStates(@Req() req: any) {
    const resp = await this.tvService.getAllStates({ user_id: req?.user?.sub });
    return {
      page: 1,
      results: resp,
      total_results: resp.length,
      total_pages: 1,
    };
  }
  @Get('paginate/:status')
  @UseGuards(AuthGuard('jwt'))
  paginate(
    @Param('status') status: TodoStatusEnum,
    @Param('sort_by') sort_by: SortType,
    @Req() req: any,
  ) {
    return this.tvService.paginateTVByStatus({
      ...req.query,
      user_id: req?.user?.sub,
      status,
    });
  }

  @Post('episodes')
  @UseGuards(AuthGuard('jwt'))
  updateTVEpisodeStatus(@Body() payload: UpdateTVEpisodeDto, @Req() req: any) {
    return this.tvService.updateTVEpisodeStatus({
      ...payload,
      user_id: req?.user?.sub,
    });
  }

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  updateTVStatus(@Body() payload: CreateTvDto, @Req() req: any) {
    return this.tvService.updateStatus({
      ...payload,
      user_id: req?.user?.sub,
    });
  }

  @Get('/discover')
  discoverTV(@Query() query: DiscoverTvRequest) {
    return this.tvService.discoverTV(query);
  }

  @Get('airing-today')
  getTodayTVAiring() {
    return this.mediaService.getTVAiringAll();
  }

  @Get('/:id')
  getTVDetail(@Param('id') id: number) {
    return this.mediaService.getTVInfo(id);
  }

  @Get(':id/recommendations')
  getMovieRecommendationsById(@Param('id') id: number) {
    return this.mediaService.getRecommendationTV(id);
  }

  @Get(':id/similar')
  getMovieSimilar(@Param('id') id: number) {
    return this.mediaService.getRecommendationTV(id);
  }

  // -------- CRON ----------
  @Get('/cron/update-info')
  updateInfo() {
    return this.tvService.updateTVInfo();
  }
}
