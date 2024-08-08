import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { MovieModule } from '../movie/movie.module';
import { TvModule } from '../tv/tv.module';
//
@Module({
  imports: [MovieModule, TvModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
