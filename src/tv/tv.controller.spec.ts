import { Test, TestingModule } from '@nestjs/testing';
import { TvController } from './tv.controller';
import { TvService } from './tv.service';

describe('TvController', () => {
  let controller: TvController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TvController],
      providers: [TvService],
    }).compile();

    controller = module.get<TvController>(TvController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
