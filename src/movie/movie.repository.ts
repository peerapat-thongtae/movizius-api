import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { MovieUser } from '../movie/schema/movie_user.schema';
import { SortType } from '../tv/types/TV.type';

interface MovieQueryPayload {
  id?: number;
  user_id?: string;
  status?: TodoStatusEnum | string;
  page?: number;
  limit?: number;
  sort_by?: SortType;
  is_anime?: boolean;
  except_ids?: number[];
}
@Injectable()
export class MovieRepository {
  private defaultPipeline: PipelineStage[] = [
    {
      $lookup: {
        from: 'movie',
        localField: 'id',
        foreignField: 'id',
        as: 'movie',
      },
    },
    { $unwind: '$movie' },
    {
      $addFields: {
        account_status: {
          $cond: {
            if: { $ne: ['$watched_at', null] },
            then: 'watched',
            else: {
              $cond: {
                if: {
                  $ne: ['$watchlisted_at', null],
                },
                then: 'watchlist',
                else: '',
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        user_id: 1,
        account_status: 1,
        name: '$movie.title',
        title: '$movie.title',
        vote_average: '$movie.vote_average',
        vote_count: '$movie.vote_count',
        media_type: 'movie',
        is_anime: '$movie.is_anime',
        watchlisted_at: 1,
        watched_at: 1,
      },
    },
  ];
  constructor(
    @InjectModel(MovieUser.name)
    private movieUserModel: Model<MovieUser>,
  ) {}

  query(payload?: MovieQueryPayload) {
    const pipeline: PipelineStage[] = [...this.defaultPipeline];

    const matchQuery: FilterQuery<any>[] = [];
    if (payload?.id) {
      matchQuery.push({ id: payload.id });
    }

    if (payload?.user_id) {
      matchQuery.push({ user_id: payload.user_id.toString() });
    }

    if (payload?.status) {
      matchQuery.push({ account_status: payload.status.toString() });
    }

    if (payload?.is_anime) {
      matchQuery.push({ is_anime: payload.is_anime });
    }

    if (matchQuery.length > 0) {
      pipeline.push({ $match: { $and: matchQuery } });
    }

    if (payload?.sort_by) {
      if (payload.sort_by !== 'random') {
        const splitSort = _.split(payload.sort_by, '.');
        const sortField = splitSort?.[0];
        const sortType = splitSort?.[1];

        pipeline.push({
          $sort: {
            [sortField]: sortType === 'desc' ? -1 : 1,
            id: 1,
          },
        });
      } else {
        pipeline.push({
          $sample: { size: payload?.limit || 10 },
        });
      }
    }

    if (payload?.page && payload?.limit) {
      const page = payload.page;
      const limit = payload?.limit || 20;
      const skip = limit * (page - 1);

      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    } else if (payload.limit) {
      const limit = payload?.limit || 20;
      pipeline.push({ $limit: limit });
    }

    return pipeline;
  }
  async findOne(payload?: MovieQueryPayload) {
    const resp = await this.movieUserModel.aggregate(this.query(payload));
    return _.first(resp) || null;
  }

  async findMany(payload?: MovieQueryPayload) {
    const resp = await this.movieUserModel.aggregate(this.query(payload));
    return resp;
  }

  async createOrUpdate() {}

  async createOrGet() {}
}
