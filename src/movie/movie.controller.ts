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
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('v2/movie')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ transform: true }))
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Post()
  updateMovieStatus(@Req() req: any, @Body() createMovieDto: CreateMovieDto) {
    return this.movieService.updateMovieStatus({
      ...createMovieDto,
      user_id: req?.user?.sub,
    });
  }

  @Get('paginate/:status')
  paginate(@Param('status') status: TodoStatusEnum, @Req() req) {
    return this.movieService.findAll({
      page: req.query?.page,
      user_id: req?.user?.sub,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.movieService.findOne({ id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.movieService.update(+id, updateMovieDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }
}
