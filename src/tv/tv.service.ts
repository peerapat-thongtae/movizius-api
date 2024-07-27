import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as json from 'test.media.json';
import { InjectRepository } from '@nestjs/typeorm';
import { TMDBService } from '../medias/tmdb.service';
import { RatingService } from '../rating/rating.service';
import { TV } from '../tv/entities/tv.entity';
import { In, Repository } from 'typeorm';
import { TVUser } from '../tv/entities/tv_user.entity';
import { ceil } from 'lodash';
import { lastValueFrom, forkJoin, catchError, map, from } from 'rxjs';
import { TodoStatusEnum } from 'src/medias/enum/todo-status.enum';
import { FilterMovieRequest } from 'src/movie/dto/filter-movie.dto';
import { CreateTvDto } from '../tv/dto/create-tv.dto';
import { TVQueryBuilder } from '../tv/tv.query';
import { ITVAccountState } from '../tv/types/TV.type';
import { UpdateTVEpisodeDto } from '../tv/dto/create-tv.dto';
import { DiscoverTvRequest } from 'moviedb-promise';

@Injectable()
export class TvService {
  constructor(
    @InjectRepository(TV)
    private tvRepository: Repository<TV>,

    @InjectRepository(TVUser)
    private tvUserRepository: Repository<TVUser>,

    private tmdbService: TMDBService,

    @Inject(TVQueryBuilder)
    private tvQueryBuilder: TVQueryBuilder,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,
  ) {}

  async updateTVInfo() {
    const k = await this.tvRepository.find({});

    for (const data of k) {
      const tmdb = await this.tmdbService.tvInfo(data.id);

      await this.tvRepository.update(data.id, {
        number_of_episodes: tmdb.number_of_episodes,
        number_of_seasons: tmdb.number_of_seasons,
        title: tmdb.name,
        is_anime:
          tmdb.original_language === 'ja' &&
          tmdb.genres.find((genre) => genre.id === 16)
            ? true
            : false,
      });
    }
    return 1;
  }

  async createOrGetTV(tv_id: number) {
    const tmdb = await this.tmdbService.getTVInfo(tv_id);
    await this.tvRepository.upsert(
      {
        id: tmdb.id,
        number_of_episodes: tmdb.number_of_episodes,
        number_of_seasons: tmdb.number_of_seasons,
        release_date: tmdb.first_air_date,
        title: tmdb.name,
        is_anime:
          tmdb.original_language === 'ja' &&
          tmdb.genres.find((genre) => genre.id === 16)
            ? true
            : false,
      },
      ['id'],
    );

    return this.findOne({ id: tv_id });
  }

  async updateTVStatus(payload: CreateTvDto & { user_id: string }) {
    const tv = await this.createOrGetTV(payload.id);
    const foundState = await this.tvUserRepository.findOne({
      where: {
        tv: { id: payload.id },
        user_id: payload.user_id,
      },
    });

    const tvCreatePayload = this.tvUserRepository.create({
      tv: { id: payload.id },
      user_id: payload.user_id,
      watchlisted_at: new Date(),
      episode_watched: [],
    });
    if (!foundState) {
      if (payload.status === TodoStatusEnum.WATCHLIST) {
        await this.tvUserRepository.save(tvCreatePayload);
      }

      if (payload.status === TodoStatusEnum.WATCHED) {
        const allEpisodes = await this.tmdbService.getAllEpisodesByTV(
          payload.id,
        );
        tvCreatePayload.episode_watched = allEpisodes.map((val) => {
          return {
            episode_id: val.id,
            episode_number: val.episode_number,
            season_number: val.season_number,
            watched_at: new Date(),
          };
        });
        await this.tvUserRepository.save(tvCreatePayload);
      }
    }
    return this.findOne({ id: payload.id, user_id: payload.user_id });
  }

  async updateTVEpisodeStatus(
    payload: UpdateTVEpisodeDto & { user_id: string },
  ) {
    const foundTV = await this.createOrGetTV(payload.id);

    if (!foundTV.account_state_id) {
      const tvUser = this.tvUserRepository.create({
        tv: { id: payload.id },
        user_id: payload.user_id,
        episode_watched: payload.episodes,
      });
      await this.tvUserRepository.save(tvUser);
    } else {
      for (const episode of payload.episodes) {
        const foundEpisodeWatched = foundTV.episode_watched.find(
          (val) =>
            val.season_number === episode.season_number &&
            val.episode_number === episode.episode_number,
        );

        const episodePayload = foundTV.episode_watched;
        if (!foundEpisodeWatched) {
          let episode_id = episode.episode_id;
          if (!episode_id) {
            const tmdbEp = await this.tmdbService.episodeInfo({
              id: payload.id,
              season_number: episode.season_number,
              episode_number: episode.episode_number,
            });

            episode_id = tmdbEp.id;
          }
          episodePayload.push({
            ...episode,
            episode_id: episode_id,
            watched_at: new Date(),
          });
        }

        await this.tvUserRepository.update(foundTV.account_state_id, {
          episode_watched: episodePayload,
        });
      }
    }

    return this.findOne({ id: payload.id, user_id: payload.user_id });
  }

  async findOne(payload: {
    id: number;
    user_id?: string;
  }): Promise<ITVAccountState> {
    const tv = this.tvQueryBuilder.queryTV();
    tv.andWhere('tv.id = :id', { id: payload.id });

    if (payload.user_id) {
      tv.andWhere('tv_user.user_id = :user_id', { user_id: payload.user_id });
    }
    const tvData = await tv.getRawOne<ITVAccountState>();
    return tvData;
  }

  async getAllStates(payload: { user_id?: string }) {
    const qb = this.tvQueryBuilder.queryTV();

    if (payload.user_id) {
      qb.andWhere('tv_user.user_id = :user_id', { user_id: payload.user_id });
    }

    const tvData = await qb.getRawMany<ITVAccountState[]>();
    return tvData;
  }

  async paginateTVByStatus(payload: FilterMovieRequest & { user_id: string }) {
    const qb = this.tvQueryBuilder.queryTV();

    if (payload.status === TodoStatusEnum.WATCHLIST) {
      qb.andWhere('jsonb_array_length(tv_user.episode_watched) = 0');
      qb.orderBy('tv_user.watchlisted_at', 'DESC');
    }

    if (payload.status === TodoStatusEnum.WATCHING) {
      qb.andWhere(
        'jsonb_array_length(tv_user.episode_watched) > 0 and jsonb_array_length(tv_user.episode_watched) < tv.number_of_episodes',
      );
      qb.orderBy(`sqb.latest_watched`, 'DESC');
    }

    if (payload.status === TodoStatusEnum.WATCHED) {
      qb.andWhere(
        'jsonb_array_length(tv_user.episode_watched) = tv.number_of_episodes',
      );
      qb.orderBy(`sqb.latest_watched`, 'DESC');
    }

    qb.addOrderBy('tv.id', 'DESC');

    if (payload.user_id) {
      qb.andWhere('tv_user.user_id = :user_id', { user_id: payload.user_id });
    }

    const total_results = await qb.clone().getCount();

    // Pagination
    const page = payload.page || 1;
    const limit = payload?.limit || 20;
    const skip = limit * (page - 1);
    qb.limit(limit).offset(skip);

    const tvUserDatas = await qb.getRawMany();

    const results =
      tvUserDatas.length > 0
        ? await lastValueFrom(
            forkJoin(
              tvUserDatas.map((val) => {
                return this.tmdbService.getTVInfo(val.id);
              }),
            ).pipe(
              catchError(() => []),
              map(async (tmdbs) => {
                const imdbs = payload.with_imdb_rating
                  ? await this.ratingService.findByImdbIds(
                      tmdbs.map((val) => val.imdb_id),
                    )
                  : [];
                return tmdbs.map((val) => {
                  const findAccountState = tvUserDatas.find(
                    (state) => state.id === val.id,
                  );
                  return {
                    account_state: findAccountState
                      ? {
                          id: findAccountState.account_state_id,
                          media_type: 'tv',
                          number_of_episodes:
                            findAccountState.number_of_episodes,
                          number_of_seasons: findAccountState.number_of_seasons,
                          watchlisted_at: findAccountState.watchlisted_at,
                          watched_at: findAccountState.watched_at,
                          count_watched: findAccountState.count_watched,
                          latest_watched: findAccountState.latest_watched,
                          account_status: findAccountState.account_status,
                        }
                      : null,
                    is_anime: findAccountState.is_anime,
                    account_status: findAccountState?.account_status || '',
                    ...val,
                    vote_average:
                      imdbs.find((imdb) => imdb.imdb_id === val.imdb_id)
                        ?.vote_average || val.vote_average,
                    vote_count:
                      imdbs.find((imdb) => imdb.imdb_id === val.imdb_id)
                        ?.vote_count || val.vote_count,
                  };
                });
              }),
            ),
          )
        : [];
    return {
      page,
      total_results: total_results,
      total_pages: ceil(total_results / limit),
      results: results,
    };
  }

  async discoverTV(payload: DiscoverTvRequest & { with_type?: string }) {
    const defaultPayload: any = {
      with_type: '2|4',
      // with_original_language: withoutJp.map((val) => val.iso_639_1).join('|'),
      without_genres: '16',
    };
    const tvs = await this.tmdbService.discoverTv({
      ...payload,
    });

    const promises = [];
    for (const tv of tvs.results) {
      promises.push(this.tmdbService.getTVInfo(tv.id));
    }

    const tvFullDetails = (await Promise.all(promises)) || [];

    const imdbs = await this.ratingService.findByImdbIds(
      tvFullDetails.map((val) => val.imdb_id),
    );

    tvFullDetails.forEach((val) => {
      const findIMDB = imdbs.find((imdb) => imdb.imdb_id === val.imdb_id);
      val.media_type = 'tv';
      val.vote_average = findIMDB?.vote_average || val.vote_average;
      val.vote_count = findIMDB?.vote_count || val.vote_count;
    });

    tvs.results = tvFullDetails;
    return tvs;
  }
}
