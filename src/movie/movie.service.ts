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
import {
  catchError,
  flatMap,
  forkJoin,
  from,
  lastValueFrom,
  map,
  mapTo,
  mergeMap,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MediasService } from '../medias/medias.service';
import { InjectModel } from '@nestjs/mongoose';
import { Imdb, ImdbDocument } from '../medias/schema/imdb.schema';
import { Model } from 'mongoose';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,

    @InjectRepository(MovieUser)
    private movieUserRepository: Repository<MovieUser>,

    @InjectModel(Imdb.name) private imdbModel: Model<ImdbDocument>,

    private tmdbService: TMDBService,

    @Inject(forwardRef(() => MediasService))
    private mediaService: MediasService,
  ) {}
  create(createMovieDto: CreateMovieDto) {
    return 'This action adds a new movie';
  }

  async getMovieInfo(movieId: number) {
    const movieInfo = await lastValueFrom(
      from(this.tmdbService.movieInfo(movieId)).pipe(
        // Get Rating
        map(async (val) => {
          const imdbData = await this.mediaService.getImdbRating(val.imdb_id);
          return {
            ...val,
            vote_average: imdbData?.rating || val.vote_average,
            vote_count: imdbData?.votes || val.vote_count,
          };
        }),
      ),
    );
    return movieInfo;
  }

  async findAll(payload: FilterMovieRequest & { user_id: string }) {
    const qb = this.movieRepository.createQueryBuilder('movie');
    qb.leftJoin('movie.users', 'movie_user');
    qb.select([
      'movie.id as id',
      'movie_user.watchlisted_at as watchlisted_at',
      'movie_user.watched_at as watched_at',
    ]);
    qb.addSelect(
      `CASE 
        WHEN watchlisted_at is not null and watched_at is null THEN 'watchlist' 
        WHEN watched_at is not null THEN 'watched' 
        ELSE ''
        END as status`,
    );

    if (payload.user_id) {
      qb.andWhere('movie_user.user_id = :id', { id: payload.user_id });
    }

    if (payload.status === TodoStatusEnum.WATCHED) {
      qb.andWhere('watched_at is not null');
    }

    if (payload.status === TodoStatusEnum.WATCHLIST) {
      qb.andWhere('watched_at is null and watchlisted_at is not null');
    }

    qb.orderBy('movie_user.watched_at', 'DESC').addOrderBy('movie.id', 'DESC');
    const total_results = await qb.getCount();

    // Pagination
    const page = payload.page || 1;
    const limit = 20;
    const skip = limit * (page - 1);
    qb.limit(limit).offset(skip);

    const movieUserDatas = await qb.getRawMany();

    const results =
      movieUserDatas.length > 0
        ? await lastValueFrom(
            forkJoin(
              movieUserDatas.map((val) => {
                return this.getMovieInfo(val.id);
              }),
            ).pipe(
              catchError(() => []),
              map((tmdbs) => {
                return tmdbs.map((val, idx) => {
                  return {
                    account_state: movieUserDatas[idx],
                    ...val,
                  };
                });
              }),
            ),
          )
        : [];

    return {
      total_pages: ceil(total_results / limit),
      total_results,
      results: results,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} movie`;
  }

  update(id: number, updateMovieDto: UpdateMovieDto) {
    return `This action updates a #${id} movie`;
  }

  remove(id: number) {
    return `This action removes a #${id} movie`;
  }
}
