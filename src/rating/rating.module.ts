import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from '../rating/entities/rating.entity';
import { RatingCronJob } from '../rating/rating.cron';
import { LineModule } from '../line/line.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Imdb, ImdbSchema } from '../rating/schema/imdb.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Imdb.name,
        schema: ImdbSchema,
        collection: 'imdb',
      },
    ]),
    TypeOrmModule.forFeature([Rating]),
    LineModule,
  ],
  controllers: [RatingController],
  providers: [RatingService, RatingCronJob],
  exports: [RatingService],
})
export class RatingModule {}
