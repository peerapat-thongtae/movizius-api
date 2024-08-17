import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../movie/entities/movie.entity';
import { MovieUser } from '../movie/entities/movie_user.entity';
import { Rating } from '../rating/entities/rating.entity';
// import { getMetadataArgsStorage } from 'typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: configService.get('POSTGRES_PORT'),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          entities: [Movie, MovieUser, Rating],
          synchronize: true,
          logging: false,
          ssl: configService.get('NODE_ENV') === 'development' ? true : true,
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class PostgresModule {}
