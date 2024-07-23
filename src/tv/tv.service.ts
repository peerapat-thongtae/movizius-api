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

@Injectable()
export class TvService {
  constructor(
    @InjectRepository(TV)
    private tvRepository: Repository<TV>,

    @InjectRepository(TVUser)
    private tvUserRepository: Repository<TVUser>,

    private tmdbService: TMDBService,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,
  ) {}

  async getTVInfo(movieId: number) {
    const movieInfo = await lastValueFrom(
      from(this.tmdbService.tvInfo(movieId)).pipe(
        // Get Rating
        map(async (val) => {
          // const imdbData = await this.ratingService.findByImdbId(val.imdb_id);
          const imdbData: any = {};
          return {
            ...val,
            vote_average: imdbData?.vote_average || val.vote_average,
            vote_count: imdbData?.vote_count || val.vote_count,
          };
        }),
      ),
    );
    return movieInfo;
  }

  async updateTVInfo() {
    const k = await this.tvRepository.find({
      where: { number_of_episodes: 0 },
    });

    for (const data of k) {
      const tmdb = await this.tmdbService.tvInfo(data.id);

      await this.tvRepository.update(data.id, {
        number_of_episodes: tmdb.number_of_episodes,
        number_of_seasons: tmdb.number_of_seasons,
        title: tmdb.name,
      });
    }
    return 1;
  }
  async findAll(payload: FilterMovieRequest & { user_id: string }) {
    const qb = this.tvRepository.createQueryBuilder('tv');
    qb.leftJoin('tv.users', 'tv_user');
    qb.select([
      'tv.id as id',
      'tv.title as title',
      'tv.number_of_episodes as number_of_episodes',
      'tv.number_of_seasons as number_of_seasons',
      'tv_user.id as account_state_id',
      'tv_user.watchlisted_at as watchlisted_at',
      'jsonb_array_length(tv_user.episode_watched) as count_watched',
      `
        CASE WHEN (jsonb_array_length(tv_user.episode_watched) > 0 and jsonb_array_length(tv_user.episode_watched) < tv.number_of_episodes) THEN 'watching'
          WHEN jsonb_array_length(tv_user.episode_watched) = tv.number_of_episodes THEN 'watched'
          WHEN jsonb_array_length(tv_user.episode_watched) = 0 THEN 'watchlist'
          ELSE '' END as account_status
      `,
      'sqb.latest_watched as latest_watched',
    ]);

    const subQuery = this.tvUserRepository
      .createQueryBuilder('subTvUser')
      .select('subTvUser.id', 'id')
      .addSelect((subQuery) => {
        return subQuery
          .select(["MAX((elem->>'watched_at')::timestamptz) as latest_watched"])
          .from((subQb) => {
            return subQb
              .select('jsonb_array_elements(myTable.episode_watched) AS elem')
              .where('subTvUser.id = myTable.id')
              .from('tv_user', 'myTable');
          }, 'subQueryLatestWatched');
      })
      .groupBy('subTvUser.id')
      .getQuery();

    qb.leftJoin(`(${subQuery})`, 'sqb', 'sqb.id = tv_user.id');

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
      // qb.orderBy('subQueryLatestWatched', 'DESC');
    }

    qb.addOrderBy('tv.id', 'DESC');

    if (payload.user_id) {
      qb.andWhere('tv_user.user_id = :user_id', { user_id: payload.user_id });
    }
    qb.groupBy('tv.id, tv_user.id, sqb.id, sqb.latest_watched');

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
                return this.getTVInfo(val.id);
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
                    account_state: findAccountState || null,
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
      total_results: total_results,
      total_pages: ceil(total_results / limit),
      results: results,
    };
  }
}
