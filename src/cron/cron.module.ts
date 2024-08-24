import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { MovieModule } from '../movie/movie.module';
import { TvModule } from '../tv/tv.module';
import { MediasModule } from 'src/medias/medias.module';
import { LineModule } from '../line/line.module';
//
@Module({
  imports: [MediasModule, MovieModule, TvModule, LineModule],
  controllers: [CronController],
  providers: [CronService],
})
export class CronModule {}
