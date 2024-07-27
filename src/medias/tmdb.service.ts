import { EpisodeResult, MovieDb, TvSeasonResponse } from 'moviedb-promise';
import { from, lastValueFrom, map } from 'rxjs';
import * as _ from 'lodash';
import { chunk, range } from 'lodash';
import { RatingService } from '../rating/rating.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

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

  async getTVInfo(tvId: number) {
    const movieInfo = await lastValueFrom(
      from(
        this.tvInfo({
          id: tvId,
          append_to_response: 'external_ids',
        }),
      ).pipe(
        // Get Rating
        map(async (val) => {
          // const imdbData = await this.ratingService.findByImdbId(val.imdb_id);
          const imdbData: any = {};
          const externalIds: any = (val as any).external_ids;
          return {
            ...val,
            vote_average: imdbData?.vote_average || val.vote_average,
            vote_count: imdbData?.vote_count || val.vote_count,
            imdb_id: externalIds?.imdb_id || '',
          };
        }),
      ),
    );
    return movieInfo;
  }

  async getMovieInfo(id: number) {
    const movieInfo = await lastValueFrom(
      from(
        this.movieInfo({
          id: id,
          append_to_response: 'external_ids',
        }),
      ).pipe(
        // Get Rating
        map(async (val) => {
          return {
            ...val,
          };
        }),
      ),
    );
    return movieInfo;
  }

  async getAllEpisodesByTV(tv_id: number): Promise<EpisodeResult[]> {
    const tmdb = await this.tvInfo(tv_id);

    if (!tmdb) {
      return [];
    }
    const seasonAppendKey = range(0, tmdb.number_of_seasons).map(
      (ssNumber) => `season/${ssNumber + 1}`,
    );

    const chunkSeasonKeys = chunk(seasonAppendKey, 20);

    const episodes = [];
    for (const chunkSeason of chunkSeasonKeys) {
      const tmdbSeasonInfo = await this.tvInfo({
        id: tv_id,
        append_to_response: chunkSeason.join(','),
      });
      const seasonDetails = _.toArray<TvSeasonResponse>(
        _.pickBy(tmdbSeasonInfo, function (value, key) {
          return _.startsWith(key, 'season/');
        }),
      );
      for (const season of seasonDetails) {
        episodes.push(...season.episodes);
      }
    }
    return episodes;
  }
}
