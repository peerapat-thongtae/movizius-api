import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { TVUser } from '../tv/schema/tv_user.schema';
import { SortType } from '../tv/types/TV.type';

interface TVQueryPayload {
  id?: number;
  user_id?: string;
  status?: TodoStatusEnum | string;
  page?: number;
  limit?: number;
  sort_by?: SortType;
  is_anime?: boolean;
}
@Injectable()
export class TVRepository {
  private defaultPipeline: PipelineStage[] = [
    {
      $addFields: {
        latest_watched: { $max: '$episode_watched.watched_at' },
        count_watched: { $size: '$episode_watched' },
      },
    },
    {
      $lookup: {
        from: 'tv',
        localField: 'id',
        foreignField: 'id',
        as: 'tv',
      },
    },
    { $unwind: '$tv' },
    {
      $addFields: {
        account_status: {
          $cond: {
            if: { $eq: ['$count_watched', '$tv.number_of_episodes'] },
            then: 'watched',
            else: {
              $cond: {
                if: {
                  $gt: ['$count_watched', 0],
                },
                then: 'watching',
                else: 'watchlist',
              },
            }, // If false, set status to "Minor"
          },
        },
      },
    },
    {
      $addFields: {
        latest_state: {
          $cond: {
            if: { $eq: ['$account_status', 'watched'] },
            then: '$latest_watched',
            else: '$watchlisted_at',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: 1,
        user_id: 1,
        name: '$tv.name',
        media_type: 'tv',
        is_anime: 1,
        vote_average: '$tv.vote_average',
        vote_count: '$tv.vote_count',
        number_of_episodes: '$tv.number_of_episodes',
        number_of_seasons: '$tv.number_of_seasons',
        episode_watched: 1,
        latest_watched: 1,
        watchlisted_at: 1,
        count_watched: 1,
        account_status: 1,
        latest_state: 1,
      },
    },
  ];
  constructor(
    @InjectModel(TVUser.name)
    private tvUserModel: Model<TVUser>,
  ) {}

  query(payload?: TVQueryPayload) {
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

    if (payload?.page) {
      const page = payload.page;
      const limit = payload?.limit || 20;
      const skip = limit * (page - 1);

      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
    }

    return pipeline;
  }
  async findOne(payload?: TVQueryPayload) {
    const resp = await this.tvUserModel.aggregate(this.query(payload));
    return _.first(resp) || null;
  }

  async findMany(payload?: TVQueryPayload) {
    const resp = await this.tvUserModel.aggregate(this.query(payload));
    return resp;
  }

  async createOrUpdate() {}

  async createOrGet() {}
}
