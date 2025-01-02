import { Injectable } from '@nestjs/common';
import { TMDBService } from './tmdb.service';
import { chunk } from 'lodash';

import * as _ from 'lodash';
import { EpisodeResult, TvSeasonResponse } from 'moviedb-promise';
import { from, lastValueFrom, map } from 'rxjs';
import { RatingService } from '../rating/rating.service';
// import { formatInTimeZone } from 'date-fns-tz';
import dayjs from 'dayjs';

@Injectable()
export class MediasService {
  constructor(
    private tmdbService: TMDBService,
    private ratingService: RatingService,
  ) {}

  async getTVInfo(tvId: number, options?: { rating?: boolean }) {
    const rating = !!options?.rating;
    const movieInfo = await lastValueFrom(
      from(
        this.tmdbService.tvInfo({
          id: tvId,
          append_to_response:
            'credits,account_states,external_ids,belongs_to_collection,watch_providers,watch-providers,videos,release_dates,watch/providers',
        }),
      ).pipe(
        // Get Rating
        map(async (val: any) => {
          // const imdbData: any = {};
          const externalIds: any = (val as any).external_ids;
          let findRating = null;
          if (rating) {
            findRating = await this.ratingService.findByImdbId(
              externalIds?.imdb_id,
            );
          }

          return _.omit(
            {
              ...val,
              media_type: 'tv',
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
  //
  async getMovieInfo(id: number, options?: { rating?: boolean }) {
    const rating = !!options?.rating;
    const movieInfo = await lastValueFrom(
      from(
        this.tmdbService.movieInfo({
          id: id,
          append_to_response:
            'account_states,external_ids,casts,crew,belongs_to_collection,watch-providers,videos,release_dates,watch/providers',
        }),
      ).pipe(
        map(async (val) => {
          // const findRating = await this.ratingService.findByImdbId(val.imdb_id);
          let findRating = null;
          if (rating) {
            findRating = await this.ratingService.findByImdbId(val?.imdb_id);
          }

          const externalIds: any = (val as any).external_ids;
          return _.omit(
            {
              ...val,
              media_type: 'movie',
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

  async getMovieInfos(ids: number[]) {
    const promises = await Promise.all(
      ids.map((id) => this.getMovieInfo(id, { rating: false })),
    );
    const ratings = await this.ratingService.findByImdbIds(
      promises.map((val) => val.imdb_id),
    );
    promises.forEach((val) => {
      const findRating = ratings.find(
        (rating) => rating.imdb_id === val.imdb_id,
      );
      if (findRating) {
        val.vote_average = findRating?.vote_average;
        val.vote_count = findRating?.vote_count;
      }
    });
    return promises;
  }

  async getTVInfos(ids: number[]) {
    const promises = await Promise.all(
      ids.map((id) => this.getTVInfo(id, { rating: false })),
    );
    const ratings = await this.ratingService.findByImdbIds(
      promises.map((val) => val.imdb_id),
    );
    promises.forEach((val) => {
      const findRating = ratings.find(
        (rating) => rating.imdb_id === val.imdb_id,
      );
      if (findRating) {
        val.vote_average = findRating?.vote_average;
        val.vote_count = findRating?.vote_count;
      }
    });
    return promises;
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

  async getTVAiringAll(date?: Date | string) {
    const dateParam = dayjs().format('YYYY-MM-DD');
    const params: any = {
      'air_date.gte': dateParam,
      'air_date.lte': dateParam,
      sort_by: 'popularity.desc',
      // 'with_watch_providers': config.watchProviders.map(val => val.provider_id).join('|'),
      // 'region': 'TH',
      // 'timezone': 'Asia/Bangkok',
      // 'watch_region': 'TH',
      page: 1,
    };
    const resp = await this.tmdbService.discoverTv(params);
    const medias = resp.results || [];
    if (resp.total_pages > 1) {
      for (let page = 2; page <= resp.total_pages; page++) {
        const respPage = await this.tmdbService.tvAiringToday({
          ...params,
          page: page,
        });
        medias.push(...respPage.results);
      }
    }
    return {
      page: 1,
      total_pages: 1,
      results: medias,
      total_results: medias.length,
    };
  }

  async getMovieByDate() {
    const dateParam = dayjs().format('YYYY-MM-DD');
    const params: any = {
      'release_date.gte': dateParam,
      'release_date.lte': dateParam,
      sort_by: 'popularity.desc',
      // 'with_watch_providers': config.watchProviders.map(val => val.provider_id).join('|'),
      region: 'TH',
      // 'timezone': 'Asia/Bangkok',
      watch_region: 'TH',
      page: 1,
    };
    const resp = await this.tmdbService.discoverMovie(params);

    const medias = resp.results || [];
    if (resp.total_pages > 1) {
      for (let page = 2; page <= resp.total_pages; page++) {
        const respPage = await this.tmdbService.discoverMovie({
          ...params,
          page: page,
        });
        medias.push(...respPage.results);
      }
    }
    return {
      page: 1,
      total_pages: 1,
      results: medias,
      total_results: medias.length,
    };
  }
}
