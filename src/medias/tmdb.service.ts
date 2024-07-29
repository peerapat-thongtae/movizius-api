import { EpisodeResult, MovieDb, TvSeasonResponse } from 'moviedb-promise';
import { from, lastValueFrom, map } from 'rxjs';
import * as _ from 'lodash';
import { chunk, range } from 'lodash';
import { RatingService } from '../rating/rating.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TMDBService extends MovieDb {
  // private readonly movieDB: MovieDb = new MovieDb(process.env.TMDB_API_KEY);

  constructor() {
    super(process.env.TMDB_API_KEY);
  }
  async searchMovieByName(query: string, page?: number) {
    return this.searchMovie({
      query,
      page,
    });
  }
}
