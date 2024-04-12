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
import { RatingController } from './rating.controller';

@Module({
  controllers: [MovieController, TVController, RatingController],
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
  ],
  providers: [MediasService, TMDBService, AuthService],
  exports: [MediasService, TMDBService, AuthService],
})
export class MediasModule {}
