import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleCalendarController } from './schedule-calendar.controller';
import { ScheduleCalendarService } from './schedule-calendar.service';

describe('ScheduleCalendarController', () => {
  let controller: ScheduleCalendarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleCalendarController],
      providers: [ScheduleCalendarService],
    }).compile();

    controller = module.get<ScheduleCalendarController>(ScheduleCalendarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
