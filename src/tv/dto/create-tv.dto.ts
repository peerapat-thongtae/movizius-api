import { IsArray, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';

export class CreateTvDto {
  @IsNumber()
  id: number;

  @IsEnum(TodoStatusEnum)
  status: TodoStatusEnum;
}

export class UpdateTVEpisodeDto {
  @IsNumber()
  id: number;

  @IsArray()
  episodes: {
    episode_id?: number;
    season_number: number;
    episode_number: number;
    watched_at?: Date;
  }[];
}
