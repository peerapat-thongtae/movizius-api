import { Module } from '@nestjs/common';
import { ScheduleCalendarService } from './schedule-calendar.service';
import { ScheduleCalendarController } from './schedule-calendar.controller';
import { MovieModule } from '../movie/movie.module';
import { TvModule } from '../tv/tv.module';
import { MediasModule } from '../medias/medias.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Schedule,
  ScheduleSchema,
} from '../schedule-calendar/schema/schedule.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      {
        name: Schedule.name,
        schema: ScheduleSchema,
        collection: 'schedule',
      },
    ]),
    MovieModule,
    TvModule,
    MediasModule,
  ],
  controllers: [ScheduleCalendarController],
  providers: [ScheduleCalendarService],
})
export class ScheduleCalendarModule {}
