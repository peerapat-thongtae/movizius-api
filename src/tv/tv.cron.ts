import { Inject, Injectable } from '@nestjs/common';
import { TvService } from '../tv/tv.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TVCron {
  constructor(
    @Inject(TvService)
    private tvService: TvService,
  ) {}

  async updateTVInfo() {
    console.log('start');
    await this.tvService.updateTVInfo();
    console.log('success');
  }
}
