import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MovieController } from './movie.controller';
import { TMDBService } from './tmdb.service';
import { LineModule } from '../line/line.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TVController } from './tv.controller';
import { RatingController } from './rating.controller';
import { Media, MediaSchema } from './schema/medias.schema';
import { Imdb, ImdbSchema } from './schema/imdb.schema';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AnimeController } from './anime.controller';

@Module({
  controllers: [
    MovieController,
    TVController,
    RatingController,
    AnimeController,
  ],
  imports: [
    LineModule,
    HttpModule,
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
        collection: 'media',
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
