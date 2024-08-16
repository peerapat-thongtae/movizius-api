import { forwardRef, Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movie/entities/movie.entity';
import { MovieUser } from '../movie/entities/movie_user.entity';
import { TMDBService } from '../medias/tmdb.service';
import { MediasModule } from '../medias/medias.module';
import { RatingModule } from '../rating/rating.module';
import { MovieQueryBuilder } from '../movie/movie.query';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieUser]),
    RatingModule,
    forwardRef(() => MediasModule),
  ],
  controllers: [MovieController],
  providers: [MovieService, MovieQueryBuilder, TMDBService],
  exports: [MovieService],
})
export class MovieModule {}
