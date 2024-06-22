import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';

export class CreateMediaDto {
  id: string;
  status: TodoStatusEnum;
  name?: string;
}

export class UpdateTVEpisodeDto {
  id: string;
  episode_watched: {
    episode_id?: number;
    season_number: number;
    episode_number: number;
    watched_at: Date;
  }[];
}
