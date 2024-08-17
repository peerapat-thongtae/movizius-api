import { MovieResult, ReleaseDate } from 'moviedb-promise';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';

export interface MoviePaginationResponse {
  page: number;
  total_results: number;
  total_pages: number;
  results: MovieResp[];
}
export interface MovieResp extends MovieResult, ReleaseDate {
  account_state: MovieAccountState | null;
  is_anime: boolean;
}

export interface MovieAccountState {
  id: number;
  media_type: string;
  account_state_id?: number;
  watchlisted_at: Date | null;
  watched_at: Date | null;
  account_status?: TodoStatusEnum;
}
