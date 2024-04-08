import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MovieController } from './movie.controller';
import { TMDBService } from './tmdb.service';
import { LineModule } from '../line/line.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schema/movie.schema';
import { TV, TVSchema } from './schema/tv.schema';
import { TVController } from './tv.controller';
import { Imdb, ImdbSchema } from './schema/imdb.schema';

@Module({
  controllers: [MovieController, TVController],
  imports: [
    LineModule,
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema,
        collection: 'movie',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: TV.name,
        schema: TVSchema,
        collection: 'tv',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Imdb.name,
        schema: ImdbSchema,
        collection: 'imdb',
      },
    ]),
  ],
  providers: [MediasService, TMDBService, AuthService],
  exports: [MediasService, TMDBService, AuthService],
})
export class MediasModule {}
