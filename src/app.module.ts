import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MediasModule } from './medias/medias.module';
import { LineModule } from './line/line.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotModule } from './chatbot/chatbot.module';
import { MongoModule } from './databases/mongo.module';
import { PostgresModule } from 'src/databases/postgres.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MediasModule,
    LineModule,
    ScheduleModule.forRoot(),
    MongoModule,
    PostgresModule,
    ChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
