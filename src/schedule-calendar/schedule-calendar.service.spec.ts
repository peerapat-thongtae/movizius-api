import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleCalendarService } from './schedule-calendar.service';

describe('ScheduleCalendarService', () => {
  let service: ScheduleCalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleCalendarService],
    }).compile();

    service = module.get<ScheduleCalendarService>(ScheduleCalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
