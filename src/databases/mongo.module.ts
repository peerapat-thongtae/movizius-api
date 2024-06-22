// MongooseModule.forRootAsync({
//      imports: [ConfigModule],
//      inject: [ConfigService],
//      useFactory: (configService: ConfigService) => {
//        return {
//          uri: configService.get<string>('MONGO_URI'),
//        };
//      },
//    }),
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('MONGO_URI'),
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class MongoModule {}
