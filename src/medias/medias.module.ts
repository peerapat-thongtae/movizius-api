import { forwardRef, Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { TMDBService } from './tmdb.service';
import { LineModule } from '../line/line.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers: [MediasController],
  imports: [LineModule, forwardRef(() => AuthModule)],
  providers: [MediasService, TMDBService, AuthService],
  exports: [MediasService, TMDBService, AuthService],
})
export class MediasModule {}
