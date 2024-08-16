import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { TMDBService } from './tmdb.service';
import { LineModule } from '../line/line.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { HttpModule } from '@nestjs/axios';
import { RatingModule } from '../rating/rating.module';
import { MovieModule } from '../movie/movie.module';
import { TvModule } from '../tv/tv.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from '../medias/schema/medias.schema';
import { MediaUser, MediaUserSchema } from '../medias/schema/media_user.schema';

@Module({
  controllers: [],
  imports: [
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
        collection: 'media',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: MediaUser.name,
        schema: MediaUserSchema,
        collection: 'media_user',
      },
    ]),
    forwardRef(() => LineModule),
    HttpModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RatingModule),
    forwardRef(() => MovieModule),
    forwardRef(() => TvModule),
  ],
  providers: [MediasService, TMDBService, AuthService],
  exports: [MediasService, TMDBService, AuthService],
})
export class MediasModule {}
