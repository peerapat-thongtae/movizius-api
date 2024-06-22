import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MediasModule } from '../medias/medias.module';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService],
  imports: [MediasModule, HttpModule, AuthModule],
})
export class ChatbotModule {}
