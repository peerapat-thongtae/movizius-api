import { Injectable } from '@nestjs/common';
import { TMDBService } from './tmdb.service';
import { chunk } from 'lodash';

import * as _ from 'lodash';
import { EpisodeResult, TvSeasonResponse } from 'moviedb-promise';
import { from, lastValueFrom, map } from 'rxjs';
import { RatingService } from '../rating/rating.service';

@Injectable()
export class MediasService {
  constructor(
    private tmdbService: TMDBService,
    private ratingService: RatingService,
  ) {}

  async getTVInfo(tvId: number) {
    const movieInfo = await lastValueFrom(
      from(
        this.tmdbService.tvInfo({
          id: tvId,
          append_to_response:
            'credits,account_states,external_ids,casts,crew,belongs_to_collection,watch_providers,watch-providers,videos,release_dates,watch/providers',
        }),
      ).pipe(
        // Get Rating
        map(async (val: any) => {
          // const imdbData: any = {};
          const externalIds: any = (val as any).external_ids;
          const findRating = await this.ratingService.findByImdbId(
            externalIds?.imdb_id,
          );

          return _.omit(
            {
              ...val,
              imdb_id: externalIds?.imdb_id || '',
              watch_providers: val?.['watch/providers'],
              vote_average: findRating?.vote_average || val.vote_average,
              vote_count: findRating?.vote_count || val.vote_count,
            },
            ['watch/providers'],
          );
        }),
      ),
    );
    return movieInfo;
  }

  async getMovieInfo(id: number) {
    const movieInfo = await lastValueFrom(
      from(
        this.tmdbService.movieInfo({
          id: id,
          append_to_response:
            'account_states,external_ids,casts,crew,belongs_to_collection,watch-providers,videos,release_dates,watch/providers',
        }),
      ).pipe(
        map(async (val) => {
          const findRating = await this.ratingService.findByImdbId(val.imdb_id);
          return {
            ...val,
            vote_average: findRating?.vote_average || val.vote_average,
            vote_count: findRating?.vote_count || val.vote_count,
          };
        }),
      ),
    );
    return movieInfo;
  }

  async getRecommendationMovies(id: number) {
    const resp = await this.tmdbService.movieRecommendations({ id });

    const promises = [];
    for (const media of resp.results) {
      promises.push(this.getMovieInfo(media.id));
    }

    const medias = await Promise.all(promises);
    resp.results = medias;

    return resp;
  }
  async getRecommendationTV(id: number) {
    const resp = await this.tmdbService.tvRecommendations({ id });

    const promises = [];
    for (const media of resp.results) {
      promises.push(this.getTVInfo(media.id));
    }

    const medias = await Promise.all(promises);
    resp.results = medias;

    return resp;
  }

  async getSimilarMovies(id: number) {
    const resp = await this.tmdbService.movieSimilar({ id });

    const promises = [];
    for (const media of resp.results) {
      promises.push(this.getMovieInfo(media.id));
    }

    const medias = await Promise.all(promises);
    resp.results = medias;

    return resp;
  }
  async getSimilarTV(id: number) {
    const resp = await this.tmdbService.tvSimilar({ id });

    const promises = [];
    for (const media of resp.results) {
      promises.push(this.getTVInfo(media.id));
    }

    const medias = await Promise.all(promises);
    resp.results = medias;

    return resp;
  }

  async getAllEpisodesByTV(tv_id: number): Promise<EpisodeResult[]> {
    const tmdb = await this.tmdbService.tvInfo(tv_id);

    if (!tmdb) {
      return [];
    }
    const seasonAppendKey = _.range(0, tmdb.number_of_seasons).map(
      (ssNumber) => `season/${ssNumber + 1}`,
    );

    const chunkSeasonKeys = chunk(seasonAppendKey, 20);

    const episodes = [];
    for (const chunkSeason of chunkSeasonKeys) {
      const tmdbSeasonInfo = await this.tmdbService.tvInfo({
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
