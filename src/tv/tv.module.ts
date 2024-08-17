import { forwardRef, Module } from '@nestjs/common';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';
import { RatingModule } from '../rating/rating.module';
import { TMDBService } from '../medias/tmdb.service';
import { TVCron } from '../tv/tv.cron';
import { MediasModule } from '../medias/medias.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TV } from '../tv/entities/tv.entity';
import { TVSchema } from '../tv/schema/tv.schema';

import { TVUser, TVUserSchema } from '../tv/schema/tv_user.schema';
import { TVRepository } from '../tv/tv.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TV.name,
        schema: TVSchema,
        collection: 'tv',
      },
    ]),
    MongooseModule.forFeature([
      {
        name: TVUser.name,
        schema: TVUserSchema,
        collection: 'tv_user',
      },
    ]),
    RatingModule,
    forwardRef(() => MediasModule),
  ],
  controllers: [TvController],
  providers: [TvService, TVRepository, TMDBService, TVCron],
  exports: [TvService, TVRepository],
})
export class TvModule {}
