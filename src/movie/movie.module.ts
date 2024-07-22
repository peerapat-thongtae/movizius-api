import { forwardRef, Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movie/entities/movie.entity';
import { MovieUser } from '../movie/entities/movie_user.entity';
import { TMDBService } from '../medias/tmdb.service';
import { MediasService } from '../medias/medias.service';
import { MediasModule } from '../medias/medias.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Imdb, ImdbSchema } from '../medias/schema/imdb.schema';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie, MovieUser]),
    MongooseModule.forFeature([
      {
        name: Imdb.name,
        schema: ImdbSchema,
        collection: 'imdb',
      },
    ]),
    RatingModule,
  ],
  controllers: [MovieController],
  providers: [MovieService, TMDBService],
})
export class MovieModule {}
