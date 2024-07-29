import { forwardRef, Module } from '@nestjs/common';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TV } from '../tv/entities/tv.entity';
import { TVUser } from '../tv/entities/tv_user.entity';
import { RatingModule } from '../rating/rating.module';
import { TMDBService } from '../medias/tmdb.service';
import { TVQueryBuilder } from '../tv/tv.query';
import { TVCron } from '../tv/tv.cron';
import { MediasModule } from '../medias/medias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TV, TVUser]),
    RatingModule,
    forwardRef(() => MediasModule),
  ],
  controllers: [TvController],
  providers: [TvService, TMDBService, TVQueryBuilder, TVCron],
  exports: [TvService],
})
export class TvModule {}
