import { ShowResponse } from 'moviedb-promise';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';

export interface ITVPaginationResponse {
  total_results: number;
  total_pages: number;
  results: ITVResp[];
}
export interface ITVResp extends ShowResponse {
  account_state: ITVAccountState | null;
  is_anime: boolean;
}

export interface ITVAccountState {
  id: number;
  number_of_episodes: number;
  number_of_seasons: number;
  account_state_id?: number;
  watchlisted_at: Date | null;
  watched_at: Date | null;
  account_status: TodoStatusEnum;
  episode_watched?: IEpisodeWatched[];
}

export interface IEpisodeWatched {
  episode_id?: number;
  episode_number: number;
  season_number: number;
  watched_at: Date | null;
}

export type SortType =
  | 'watched_at.desc'
  | 'watched_at.asc'
  | 'watchlisted_at.desc'
  | 'watchlisted_at.asc'
  | 'id.desc'
  | 'id.asc'
  | 'number_of_episodes.desc'
  | 'number_of_episodes.asc'
  | 'latest_watched.desc'
  | 'latest_watched.asc'
  | 'random'
  | '';
