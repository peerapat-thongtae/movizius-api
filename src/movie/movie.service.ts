import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ceil, omit, pick, pickBy, split } from 'lodash';
import { FilterMovieRequest } from './dto/filter-movie.dto';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { TMDBService } from '../medias/tmdb.service';
import { RatingService } from '../rating/rating.service';
import { MoviePaginationResponse } from '../movie/types/Movie.type';
import { DiscoverMovieRequest } from 'moviedb-promise';
import { MediasService } from '../medias/medias.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Movie } from '../movie/schema/movie.schema';
import { MovieUser } from '../movie/schema/movie_user.schema';
import { MovieRepository } from '../movie/movie.repository';
import { SortType } from '../tv/types/TV.type';

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
    private movieRepository: MovieRepository,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,

    // private media_type: string = 'movie',
  ) {}

  async updateMovieInfo() {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const k = await this.movieModel.find(
      {
        updated_at: { $lt: twelveHoursAgo },
      },
      {},
      { limit: 80 },
    );

    const tmdbs = await Promise.all(
      k.map((data) => this.mediaService.getMovieInfo(data.id)),
    );
    for (const tmdb of tmdbs) {
      await this.movieModel.updateOne(
        { id: tmdb.id },
        {
          id: tmdb.id,
          title: tmdb.title,
          release_date: tmdb.release_date,
          runtime: tmdb.runtime,
          is_anime:
            tmdb.original_language === 'ja' &&
            tmdb.genres.find((genre) => genre.id === 16)
              ? true
              : false,
          vote_average: tmdb?.vote_average,
          vote_count: tmdb?.vote_count,
          // metadata: tmdb,
          updated_at: new Date(),
        },
      );
    }
    return k.map((val) => val.id);
  }
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

    let sort: SortType = '';
    if (!payload.sort) {
      if (payload.status === 'watchlist') {
        sort = 'watchlisted_at.desc';
      } else {
        sort = 'watched_at.desc';
      }
    } else {
      sort = payload.sort;
    }
    const payloadQuery = {
      user_id: payload.user_id,
      sort_by: sort,
      status: payload.status,
      page: page,
    };
    const query = this.movieRepository.query(payloadQuery);
    const totalQuery = this.movieRepository.query(omit(payloadQuery, ['page']));

    const resp = await this.movieUserModel.aggregate(query);

    const totalResp = await this.movieUserModel.aggregate(totalQuery);
    const total_results = totalResp.length;
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

    movieFullDetails.forEach((val) => {
      val.media_type = 'movie';
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

  async randomMovie(payload: {
    page?: number;
    total: number;
    status?: TodoStatusEnum;
    user_id: string;
  }) {
    const query = this.movieRepository.query({
      page: payload?.page,
      user_id: payload.user_id,
      limit: payload.total,
      status: payload.status,
      except_ids: [],
      sort_by: 'random',
    });

    const resp = await this.movieUserModel.aggregate(query);
    const results = await this.mediaService.getMovieInfos(
      resp.map((val) => val.id),
    );

    return {
      page: 1,
      total_pages: 1,
      total_results: results.length,
      results: results,
    };
  }

  async createOrUpdate(payload: {
    id: number;
    user_id: string;
    status: TodoStatusEnum;
  }): Promise<MovieUser> {
    await this.createOrGet(payload.id);
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
