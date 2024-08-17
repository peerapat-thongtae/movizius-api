import { forwardRef, Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
// import { Movie } from '../movie/entities/movie.entity';
import { MovieUser } from '../movie/entities/movie_user.entity';
import { TMDBService } from '../medias/tmdb.service';
import { MediasModule } from '../medias/medias.module';
import { RatingModule } from '../rating/rating.module';
// import { MovieQueryBuilder } from '../movie/movie.query';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from '../medias/schema/medias.schema';
import { MediaUser, MediaUserSchema } from '../medias/schema/media_user.schema';
import { Movie, MovieSchema } from '../movie/schema/movie.schema';
import { MovieUserSchema } from '../movie/schema/movie_user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema,
        collection: 'movie',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: MovieUser.name,
        schema: MovieUserSchema,
        collection: 'movie_user',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: MediaUser.name,
        schema: MediaUserSchema,
      },
    ]),
    RatingModule,
    forwardRef(() => MediasModule),
  ],
  controllers: [MovieController],
  providers: [MovieService, TMDBService],
  exports: [MovieService, TMDBService],
})
export class MovieModule {}
