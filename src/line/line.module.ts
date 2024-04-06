/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { MediasModule } from '../medias/medias.module';
import { TMDBService } from '../medias/tmdb.service';
import LineController from './line.controller';
// import { LineMiddleware } from './line.middleware';
import { LineService } from './line.service';

@Module({
  imports: [forwardRef(() => MediasModule)],
  controllers: [LineController],
  providers: [LineService, TMDBService],
  exports: [LineService],
})
export class LineModule {}
