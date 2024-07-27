import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from '../rating/entities/rating.entity';
import { RatingCronJob } from '../rating/rating.cron';

@Module({
  imports: [TypeOrmModule.forFeature([Rating])],
  controllers: [RatingController],
  providers: [RatingService, RatingCronJob],
  exports: [RatingService],
})
export class RatingModule {}
