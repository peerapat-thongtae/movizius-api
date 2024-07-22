import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movie/entities/movie.entity';
import { MovieUser } from '../movie/entities/movie_user.entity';
import { TMDBService } from '../medias/tmdb.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, MovieUser])],
  controllers: [MovieController],
  providers: [MovieService, TMDBService],
})
export class MovieModule {}
