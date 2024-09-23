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
import { PostgresModule } from './databases/postgres.module';
import { MovieModule } from './movie/movie.module';
import { RatingModule } from './rating/rating.module';
import { TvModule } from './tv/tv.module';
import { CronModule } from './cron/cron.module';
import { MongoModule } from './databases/mongo.module';
import { ScheduleCalendarModule } from './schedule-calendar/schedule-calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MediasModule,
    LineModule,
    ScheduleModule.forRoot(),
    PostgresModule,
    MongoModule,
    CronModule,
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => {
    //     return {
    //       uri: configService.get<string>('MONGO_URI'),
    //     };
    //   },
    // }),
    // ChatbotModule,
    MovieModule,
    RatingModule,
    TvModule,
    ScheduleCalendarModule,
    // CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
