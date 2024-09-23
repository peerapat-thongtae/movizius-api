import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { TMDBService } from '../medias/tmdb.service';
import { RatingService } from '../rating/rating.service';
import { ceil, difference, first, uniq } from 'lodash';
import { lastValueFrom, map, from } from 'rxjs';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { CreateTvDto } from '../tv/dto/create-tv.dto';
import { ITVAccountState, SortType } from '../tv/types/TV.type';
import { UpdateTVEpisodeDto } from '../tv/dto/create-tv.dto';
import { DiscoverTvRequest } from 'moviedb-promise';
import { languages } from '../medias/constraints/tmdb.constraint';
import { MediasService } from '../medias/medias.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { TV } from '../tv/schema/tv.schema';
import { TVUser } from '../tv/schema/tv_user.schema';
import { TVRepository } from '../tv/tv.repository';

@Injectable()
export class TvService {
  private media_type = 'tv';
  constructor(
    @InjectModel(TV.name)
    private tvModel: Model<TV>,

    @Inject(TVRepository)
    private tvRepository: TVRepository,

    @InjectModel(TVUser.name)
    private tvUserModel: Model<TVUser>,

    private tmdbService: TMDBService,
    private mediaService: MediasService,

    // @Inject(TVQueryBuilder)
    // private tvQueryBuilder: TVQueryBuilder,

    @Inject(forwardRef(() => RatingService))
    private ratingService: RatingService,
  ) {}

  async updateTVInfo() {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const k = await this.tvModel.find(
      {
        updated_at: { $lt: twelveHoursAgo },
      },
      {},
      { limit: 80 },
    );
    const tmdbs = await Promise.all(
      k.map((data) => this.mediaService.getTVInfo(data.id)),
    );
    for (const tmdb of tmdbs) {
      await this.tvModel.updateOne(
        { id: tmdb.id },
        {
          id: tmdb.id,
          number_of_episodes: tmdb.number_of_episodes,
          number_of_seasons: tmdb.number_of_seasons,
          name: tmdb.name,
          is_anime:
            tmdb.original_language === 'ja' &&
            tmdb.genres.find((genre) => genre.id === 16)
              ? true
              : false,
          vote_average: tmdb?.vote_average,
          vote_count: tmdb?.vote_count,
          updated_at: new Date(),
        },
      );
    }
    return k.length;
  }
  async createOrGet(id: number) {
    const tmdb = await this.mediaService.getTVInfo(id);
    const rating = await this.ratingService.findByImdbId(tmdb.imdb_id);
    const foundMedia = await this.tvModel.findOne({ id });
    if (!foundMedia) {
      await this.tvModel.create({
        media_type: this.media_type,
        id: tmdb.id,
        number_of_episodes: tmdb.number_of_episodes,
        number_of_seasons: tmdb.number_of_seasons,
        release_date: tmdb.first_air_date,
        title: tmdb.name,
        vote_average: rating?.vote_average || tmdb.vote_average,
        vote_count: rating?.vote_count || tmdb.vote_count,
        is_anime:
          tmdb.original_language === 'ja' &&
          tmdb.genres.find((genre) => genre.id === 16)
            ? true
            : false,
      });
    } else {
      await this.tvModel.updateOne(
        { id },
        {
          id: tmdb.id,
          media_type: this.media_type,
          number_of_episodes: tmdb.number_of_episodes,
          number_of_seasons: tmdb.number_of_seasons,
          release_date: tmdb.first_air_date,
          title: tmdb.name,
          vote_average: rating?.vote_average || tmdb.vote_average,
          vote_count: rating?.vote_count || tmdb.vote_count,
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

  async updateStatus(payload: CreateTvDto & { user_id: string }) {
    await this.createOrGet(payload.id);
    // const foundState = await this.tvUserModel.findOne({
    //   id: payload.id,
    //   user_id: payload.user_id,
    // });
    const foundState = await this.tvRepository.findOne({
      id: payload.id,
      user_id: payload.user_id,
    });

    const tvCreatePayload = {
      id: payload.id,
      user_id: payload.user_id,
      watchlisted_at: new Date(),
      episode_watched: [],
    };
    if (!foundState) {
      if (payload.status === TodoStatusEnum.WATCHLIST) {
        await this.tvUserModel.create(tvCreatePayload);
      }

      if (payload.status === TodoStatusEnum.WATCHED) {
        const allEpisodes = await this.mediaService.getAllEpisodesByTV(
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
        await this.tvUserModel.create(tvCreatePayload);
      }
    } else {
      if (payload.status === TodoStatusEnum.WATCHED) {
        //
      }
    }
    return this.findOne({ id: payload.id, user_id: payload.user_id });
  }

  async updateTVEpisodeStatus(
    payload: UpdateTVEpisodeDto & { user_id: string },
  ) {
    await this.createOrGet(payload.id);
    const foundTV = await this.tvRepository.findOne({
      id: payload.id,
      user_id: payload.user_id,
    });

    if (!foundTV) {
      const tvUser = {
        id: payload.id,
        user_id: payload.user_id,
        episode_watched: payload.episodes,
      };
      await this.tvUserModel.create(tvUser);
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

        await this.tvUserModel.updateOne(
          {
            id: payload.id,
            user_id: payload.user_id,
            media_type: this.media_type,
          },
          {
            episode_watched: episodePayload,
          },
        );
      }
    }
    return this.findOne({ id: payload.id, user_id: payload.user_id });
  }

  async findOne(payload: { id: number; user_id?: string }): Promise<any> {
    const query = this.tvRepository.query({
      id: payload.id,
      user_id: payload.user_id,
    });
    const resp = await this.tvUserModel.aggregate(query);
    return first(resp) || null;
  }

  async getAllStates(payload: { user_id?: string }) {
    const query = this.tvRepository.query({ user_id: payload.user_id });
    return this.tvUserModel.aggregate(query);
  }

  async paginateTVByStatus({
    user_id,
    page,
    status,
    sort,
  }: {
    user_id: string;
    page: number;
    status: TodoStatusEnum;
    sort?: SortType;
    is_anime?: boolean;
  }) {
    const limit = 20;
    const skip = limit * (page - 1);

    let sorts: SortType = '';
    if (!sort) {
      if (status === 'watchlist') {
        sorts = 'watchlisted_at.desc';
      } else {
        sorts = 'latest_watched.desc';
      }
    } else {
      sorts = sort;
    }
    const query = this.tvRepository.query({
      user_id,
      status,
      sort_by: sorts,
    });
    const paginatationQuery: PipelineStage[] = [
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];
    const totalQuery = await this.tvUserModel.aggregate(query);
    const filter: TV[] = await this.tvUserModel.aggregate([
      ...query,
      ...paginatationQuery,
    ]);

    const results = await Promise.all(
      filter.map((val) =>
        lastValueFrom(
          from(this.mediaService.getTVInfo(val.id)).pipe(
            map((tmdb) => {
              return {
                ...val,
                ...tmdb,
              };
            }),
          ),
        ),
      ),
    );

    return {
      page: +page,
      results: results,
      total_results: totalQuery.length,
      total_pages: ceil(totalQuery.length / limit),
    };
  }

  async discoverTV(payload: DiscoverTvRequest & { with_type?: string }) {
    const params: any = {
      ...payload,
      without_genres: `${payload.without_genres},${['10763', '10764', '10766', '10767'].join(',')}`,
      // with_type: uniq([...payload?.with_type?.split('|'), '2', '4']).join('|'),
      with_type: '2|4',
      // with_original_language: languages
      //   .filter((val) => val.iso_639_1 !== 'jp')
      //   .map((val) => val.iso_639_1)
      //   .join('|'),
      // without_genres: '16',
    };
    const tvs = await this.tmdbService.discoverTv(params);

    if (tvs.total_results === 0) {
      return tvs;
    }
    const promises = [];
    for (const tv of tvs.results) {
      promises.push(this.mediaService.getTVInfo(tv.id));
    }

    const tvFullDetails = (await Promise.all(promises)) || [];

    tvFullDetails.forEach((val) => {
      // const findIMDB = imdbs.find((imdb) => imdb.imdb_id === val.imdb_id);
      val.media_type = 'tv';
    });

    tvs.results = tvFullDetails;
    return tvs;
  }

  async test() {
    return this.tvRepository.findMany({
      status: 'watching',
    });
  }
}
