import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MediasModule } from '../medias/medias.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { MovieModule } from '../movie/movie.module';
import { TvModule } from '../tv/tv.module';

@Module({
  imports: [MediasModule, MovieModule, TvModule, HttpModule, AuthModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
