import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ceil } from 'lodash';
import { FilterMovieRequest } from './dto/filter-movie.dto';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { TMDBService } from '../medias/tmdb.service';
import { RatingService } from '../rating/rating.service';
import { MoviePaginationResponse } from '../movie/types/Movie.type';
import { DiscoverMovieRequest } from 'moviedb-promise';
import { MediasService } from '../medias/medias.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from '../movie/schema/movie.schema';
import { MovieUser } from '../movie/schema/movie_user.schema';

@Injectable()
export class MovieService {
  private media_type = 'movie';
  constructor(
    // @InjectModel(Media.name)
    // private movieModel: Model<Media>,

    // @InjectModel(MediaUser.name)
    // private movieUserModel: Model<MediaUser>,

    @InjectModel(Movie.name)
    private movieModel: Model<Movie>,

    @InjectModel(MovieUser.name)
    private movieUserModel: Model<MovieUser>,

    private mediaService: MediasService,
    private tmdbService: TMDBService,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,

    // private media_type: string = 'movie',
  ) {}

  async createOrGet(id: number) {
    const tmdb = await this.mediaService.getMovieInfo(id);
    const foundMedia = await this.movieModel.findOne({ id });
    if (!foundMedia) {
      await this.movieModel.create({
        id: tmdb.id,
        media_type: 'movie',
        name: tmdb.title,
        is_anime:
          tmdb.original_language === 'ja' &&
          tmdb.genres.find((genre) => genre.id === 16)
            ? true
            : false,
      });
    } else {
      await this.movieModel.updateOne(
        { id },
        {
          id: tmdb.id,
          media_type: 'movie',
          // release_date: tmdb.release_date,
          name: tmdb.title,
          is_anime:
            tmdb.original_language === 'ja' &&
            tmdb.genres.find((genre) => genre.id === 16)
              ? true
              : false,
        },
      );
    }

    return this.findOne({ id });
  }

  async updateStatus(createMovieDto: CreateMovieDto & { user_id: string }) {
    return this.createOrUpdate(createMovieDto);
  }

  async getAllMovieStateByUser({
    user_id,
  }: {
    user_id: string;
  }): Promise<any[]> {
    const models = await this.movieUserModel.find({
      user_id: user_id,
    });
    return models.map((model) => {
      return {
        id: model.id,
        media_type: 'movie',
        watchlisted_at: model.watchlisted_at,
        watched_at: model.watched_at,
        account_status: model.account_status,
      };
    });
  }

  async findOne(payload: { id: number; user_id?: string }): Promise<any> {
    const filterPayload: any = {
      id: payload.id,
    };

    if (payload.user_id) {
      filterPayload.user_id = payload.user_id;
    }
    const mediaUser = await this.movieUserModel.findOne({ ...filterPayload });
    const media = await this.movieModel.findOne({ id: payload.id });
    if (!media) {
      return null;
    }

    const resp = {
      ...media,
      media_user: mediaUser || null,
    };
    return resp;
  }

  async findAll(
    payload: FilterMovieRequest & { user_id: string },
  ): Promise<MoviePaginationResponse> {
    const page = payload?.page || 1;
    const skip = 20 * (page - 1);
    const limit = 20;
    const filterPayload: any = {
      media_type: 'movie',
    };

    const sortPayload: any = {};

    if (payload.user_id) {
      filterPayload.user_id = payload.user_id;
    }

    if (payload.status === 'watchlist') {
      filterPayload.watchlisted_at = { $ne: null };
      filterPayload.watched_at = { $eq: null };
    }

    if (payload.status === 'watched') {
      filterPayload.watched_at = { $ne: null };
    }
    const total_results = await this.movieUserModel
      .find(filterPayload)
      .countDocuments();

    if (!payload.sort) {
      if (payload.status === 'watched') {
        sortPayload.watched_at = -1;
      }
      if (payload.status === 'watchlist') {
        sortPayload.watchlisted_at = -1;
      }
    }

    const resp = await this.movieUserModel.find(
      filterPayload,
      {},
      {
        skip: skip,
        limit: limit,
        sort: {
          ...sortPayload,
          id: -1,
        },
      },
    );

    const promises = [];
    for (const media of resp) {
      const movieDetail = this.mediaService.getMovieInfo(media.id);
      promises.push(movieDetail);
    }

    const results = await Promise.all(promises);

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
      promises.push(this.mediaService.getMovieInfo(movie.id));
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

  async randomMovie(payload: { total: number; status?: TodoStatusEnum }) {
    return {};
  }

  async createOrUpdate(payload: {
    id: number;
    user_id: string;
    status: TodoStatusEnum;
  }): Promise<MovieUser> {
    const found = await this.movieUserModel.findOne({
      id: payload.id,
      user_id: payload.user_id,
      media_type: this.media_type,
    });

    if (!found) {
      return this.movieUserModel.create({
        id: payload.id,
        user_id: payload.user_id,
        media_type: this.media_type,
        watchlisted_at: new Date(),
        watched_at:
          payload.status === TodoStatusEnum.WATCHED ? new Date() : null,
      });
    } else {
      await this.movieUserModel.updateOne(
        {
          id: payload.id,
          user_id: payload.user_id,
          media_type: this.media_type,
        },
        {
          id: payload.id,
          user_id: payload.user_id,
          media_type: this.media_type,
          // watchlisted_at: new Date(),
          watched_at:
            payload.status === TodoStatusEnum.WATCHED ? new Date() : null,
        },
      );
      return this.movieUserModel.findOne({
        id: payload.id,
        user_id: payload.user_id,
        media_type: this.media_type,
      });
    }
  }
}
