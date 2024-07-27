import { Inject, Injectable } from '@nestjs/common';
import { TvService } from '../tv/tv.service';

@Injectable()
export class TVCron {
  constructor(
    @Inject(TvService)
    private tvService: TvService,
  ) {}
}
