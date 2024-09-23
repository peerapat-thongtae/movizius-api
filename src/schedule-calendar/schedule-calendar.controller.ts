import { Controller, Get } from '@nestjs/common';
import { ScheduleCalendarService } from './schedule-calendar.service';

@Controller('schedule')
export class ScheduleCalendarController {
  constructor(
    private readonly scheduleCalendarService: ScheduleCalendarService,
  ) {}

  @Get('update-tv-airing')
  updateTVAiring() {
    return this.scheduleCalendarService.updateTVCalendar();
  }

  @Get('update-movie-airing')
  updateMovieAiring() {
    return this.scheduleCalendarService.updateMovieCalendar();
  }
}
