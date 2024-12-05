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
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { AuthGuard } from '@nestjs/passport';
import { DiscoverMovieRequest } from 'moviedb-promise';
import { MediasService } from '../medias/medias.service';

@Controller('v2/movie')
@UsePipes(new ValidationPipe({ transform: true }))
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly mediaService: MediasService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  updateStatus(@Req() req: any, @Body() createMovieDto: CreateMovieDto) {
    return this.movieService.updateStatus({
      ...createMovieDto,
      user_id: req?.user?.sub,
    });
  }

  @Get('paginate/:status')
  @UseGuards(AuthGuard('jwt'))
  paginate(@Param('status') status: TodoStatusEnum, @Req() req: any) {
    return this.movieService.findAll({
      ...req.query,
      user_id: req?.user?.sub,
      status,
    });
  }

  @Get('random')
  @UseGuards(AuthGuard('jwt'))
  randomMovie(@Req() req: any) {
    return this.movieService.randomMovie({
      total: 5,
      status: TodoStatusEnum.WATCHLIST,
      user_id: req?.user?.sub,
    });
  }

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getAllMovieStateByUser(@Req() req: any) {
    const resp = await this.movieService.getAllMovieStateByUser({
      user_id: req?.user?.sub,
    });

    return {
      total_results: resp.length,
      total_pages: 1,
      results: resp,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.movieService.update(+id, updateMovieDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }

  // ---------------- TMDB -------------//
  @Get('/discover')
  async discoverMovie(@Req() req: any, @Query() query: DiscoverMovieRequest) {
    const resp = await this.movieService.discoverMovie({ ...query });
    return resp;
  }
  @Get('/:id')
  getMovieInfo(@Param('id') id: number) {
    return this.mediaService.getMovieInfo(id);
  }

  @Get(':id/recommendations')
  getMovieRecommendationsById(@Param('id') id: number) {
    return this.mediaService.getRecommendationMovies(id);
  }

  @Get(':id/similar')
  getMovieSimilar(@Param('id') id: number) {
    return this.mediaService.getSimilarMovies(id);
  }
}
