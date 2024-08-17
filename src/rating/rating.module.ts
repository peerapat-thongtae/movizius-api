import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
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
    LineModule,
  ],
  controllers: [RatingController],
  providers: [RatingService, RatingCronJob],
  exports: [RatingService],
})
export class RatingModule {}
