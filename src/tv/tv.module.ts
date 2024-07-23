import { Module } from '@nestjs/common';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TV } from '../tv/entities/tv.entity';
import { TVUser } from '../tv/entities/tv_user.entity';
import { RatingModule } from '../rating/rating.module';
import { TMDBService } from '../medias/tmdb.service';

@Module({
  imports: [TypeOrmModule.forFeature([TV, TVUser]), RatingModule],
  controllers: [TvController],
  providers: [TvService, TMDBService],
})
export class TvModule {}
