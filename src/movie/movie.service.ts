import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { ceil, filter, includes, keyBy, mapValues } from 'lodash';
import { MovieUser } from './entities/movie_user.entity';
import { FilterMovieRequest } from './dto/filter-movie.dto';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { TMDBService } from '../medias/tmdb.service';
import { catchError, forkJoin, from, lastValueFrom, map, tap } from 'rxjs';
import { RatingService } from '../rating/rating.service';
import {
  MovieAccountState,
  MoviePaginationResponse,
  MovieResp,
} from '../movie/types/Movie.type';
import { DiscoverMovieRequest, MovieResponse } from 'moviedb-promise';
import { MovieQueryBuilder } from '../movie/movie.query';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,

    @InjectRepository(MovieUser)
    private movieUserRepository: Repository<MovieUser>,

    @Inject(MovieQueryBuilder)
    private movieQueryBuilder: MovieQueryBuilder,

    private tmdbService: TMDBService,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,
  ) {}

  async updateMovieStatus(
    createMovieDto: CreateMovieDto & { user_id: string },
  ) {
    const foundMovie = await this.findOne({
      id: createMovieDto.id,
      user_id: createMovieDto.user_id,
    });
    if (foundMovie) {
      if (createMovieDto.status === TodoStatusEnum.WATCHED) {
        return await this.movieUserRepository.update(
          { id: foundMovie?.account_state?.account_state_id },
          { watched_at: new Date() },
        );
      }

      if (createMovieDto.status === TodoStatusEnum.WATCHLIST) {
        await this.movieUserRepository.update(
          { id: foundMovie?.account_state?.account_state_id },
          { watched_at: null, watchlisted_at: new Date() },
        );
        return 1;
      }
    } else {
      await this.movieRepository.insert({
        id: createMovieDto.id,
      });
      await this.movieUserRepository.insert({
        user_id: createMovieDto.user_id,
        movie: { id: createMovieDto.id },
        watchlisted_at: new Date(),
        watched_at:
          createMovieDto.status === TodoStatusEnum.WATCHED ? new Date() : null,
      });
      return 1;
    }
    return 0;
  }

  async getAllMovieStateByUser({
    user_id,
  }: {
    user_id: string;
  }): Promise<MovieAccountState[]> {
    const qb = this.movieQueryBuilder.queryMovie();

    if (user_id) {
      qb.andWhere(`movie_user.user_id = :user_id`, { user_id: user_id });
    }

    const models = await qb.getRawMany<MovieAccountState>();
    return models.map((model) => {
      return {
        id: model.id,
        media_type: 'movie',
        account_state_id: model?.account_state_id,
        watchlisted_at: model.watchlisted_at,
        watched_at: model.watched_at,
        account_status: model.account_status,
      };
    });
  }

  async getMovieInfo(movieId: number): Promise<MovieResponse> {
    const movieInfo = await lastValueFrom(
      from(this.tmdbService.movieInfo(movieId)).pipe(
        // Get Rating
        map(async (val) => {
          const imdbData = await this.ratingService.findByImdbId(val.imdb_id);
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

  async findOne(payload: { id: number; user_id?: string }): Promise<MovieResp> {
    const qb = this.movieQueryBuilder.queryMovie();
    qb.andWhere('movie.id = :id', { id: payload.id });

    if (payload.user_id) {
      qb.andWhere(`movie_user.user_id = '${payload.user_id}'`);
    }

    const model = await qb.getRawOne();

    const tmdb = await this.getMovieInfo(payload.id);
    return {
      account_state: model
        ? {
            id: model.id,
            media_type: 'movie',
            account_state_id: model?.account_state_id,
            watchlisted_at: model.watchlisted_at,
            watched_at: model.watched_at,
            account_status: model.account_status,
          }
        : null,
      ...tmdb,
      is_anime: model?.is_anime || false,
      media_type: 'movie',
    };
  }

  async findAll(
    payload: FilterMovieRequest & { user_id: string },
  ): Promise<MoviePaginationResponse> {
    const qb = this.movieQueryBuilder.queryMovie();

    if (payload.user_id) {
      qb.andWhere('movie_user.user_id = :id', { id: payload.user_id });
    }

    if (payload.status === TodoStatusEnum.WATCHED) {
      qb.andWhere('watched_at is not null');
      qb.orderBy('movie_user.watched_at', 'DESC').addOrderBy(
        'movie.id',
        'DESC',
      );
    }

    if (payload.status === TodoStatusEnum.WATCHLIST) {
      qb.andWhere('watched_at is null and watchlisted_at is not null');
      qb.orderBy('movie_user.watchlisted_at', 'DESC').addOrderBy(
        'movie.id',
        'DESC',
      );
    }

    const total_results = await qb.getCount();

    // Pagination
    const page = payload.page || 1;
    const limit = payload?.limit || 20;
    const skip = limit * (page - 1);
    qb.limit(limit).offset(skip);

    const movieUserDatas = await qb.getRawMany();

    const results: MovieResp[] =
      movieUserDatas.length > 0
        ? await lastValueFrom(
            forkJoin(
              movieUserDatas.map((val) => {
                return this.getMovieInfo(val.id);
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
                  const findAccountState = movieUserDatas.find(
                    (state) => state.id === val.id,
                  );
                  return {
                    account_state: findAccountState
                      ? {
                          movie_id: findAccountState.id,
                          media_type: 'movie',
                          account_state_id: findAccountState?.account_state_id,
                          watchlisted_at: findAccountState.watchlisted_at,
                          watched_at: findAccountState.watched_at,
                          account_status: findAccountState.account_status,
                        }
                      : null,
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
      total_pages: ceil(total_results / limit),
      total_results,
      results: results,
    };
  }

  async discoverMovie(payload: DiscoverMovieRequest) {
    const movies = await this.tmdbService.discoverMovie(payload);

    const promises = [];
    for (const movie of movies.results) {
      promises.push(this.tmdbService.getMovieInfo(movie.id));
    }

    const movieFullDetails = (await Promise.all(promises)) || [];

    const imdbs = await this.ratingService.findByImdbIds(
      movieFullDetails.map((val) => val.imdb_id),
    );

    movieFullDetails.forEach((val) => {
      const findIMDB = imdbs.find((imdb) => imdb.imdb_id === val.imdb_id);
      val.media_type = 'movie';
      val.vote_average = findIMDB?.vote_average || val.vote_average;
      val.vote_count = findIMDB?.vote_count || val.vote_count;
    });

    movies.results = movieFullDetails;
    return movies;
  }

  update(id: number, updateMovieDto: UpdateMovieDto) {
    return `This action updates a #${id} movie`;
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
