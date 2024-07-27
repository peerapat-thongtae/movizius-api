import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MovieController } from './movie.controller';
import { TMDBService } from './tmdb.service';
import { LineModule } from '../line/line.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TVController } from './tv.controller';
import { RatingController } from './rating.controller';
import { Media, MediaSchema } from './schema/medias.schema';
import { Imdb, ImdbSchema } from './schema/imdb.schema';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AnimeController } from './anime.controller';
import { MediaCronService } from '../medias/media-cron.service';
import { RatingModule } from '../rating/rating.module';

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
    RatingModule,
  ],
  providers: [MediasService, TMDBService, AuthService, MediaCronService],
  exports: [MediasService, TMDBService, AuthService, MediaCronService],
})
export class MediasModule {}
