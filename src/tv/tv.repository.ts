import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { TVUser } from '../tv/schema/tv_user.schema';
import { SortType } from '../tv/types/TV.type';
import dayjs from 'dayjs';

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
        // max_watched_ep: { $max: '$episode_watched' },
        max_watched_ep: {
          $reduce: {
            input: '$episode_watched',
            initialValue: null,
            in: {
              $cond: [
                {
                  $or: [
                    { $gt: ['$$this.season_number', '$$value.season_number'] },
                    {
                      $and: [
                        {
                          $eq: [
                            '$$this.season_number',
                            '$$value.season_number',
                          ],
                        },
                        {
                          $gt: [
                            '$$this.episode_number',
                            '$$value.episode_number',
                          ],
                        },
                      ],
                    },
                  ],
                },
                '$$this',
                '$$value',
              ],
            },
          },
        },
        count_watched: { $size: '$episode_watched' },
      },
    },
    {
      $addFields: {
        latest_watched: '$max_watched_ep.watched_at',
      },
    },
    // {
    //   $addFields: {
    //     next_ep_formatted: {
    //       $cond: {
    //         if: {
    //           $ne: ['$tv.next_episode_to_air.episode_number', null],
    //         },
    //         then: {
    //           $concat: [
    //             'S',
    //             {
    //               $cond: [
    //                 { $lt: ['$tv.next_episode_to_air.season_number', 10] },
    //                 {
    //                   $concat: [
    //                     '0',
    //                     { $toString: '$tv.next_episode_to_air.season_number' },
    //                   ],
    //                 },
    //                 { $toString: '$tv.next_episode_to_air.season_number' },
    //               ],
    //             },
    //             'E',
    //             {
    //               $cond: [
    //                 { $lt: ['$tv.next_episode_to_air.episode_number', 10] },
    //                 {
    //                   $concat: [
    //                     '0',
    //                     { $toString: '$tv.next_episode_to_air.episode_number' },
    //                   ],
    //                 },
    //                 { $toString: '$tv.next_episode_to_air.episode_number' },
    //               ],
    //             },
    //           ],
    //         },
    //         else: null,
    //       },
    //     },
    //   },
    // },
    // {
    //   $addFields: {
    //     latest_watched_formatted: {
    //       $cond: {
    //         if: {
    //           $ne: ['$max_watched_ep.episode_number', null],
    //         },
    //         then: {
    //           $concat: [
    //             'S',
    //             {
    //               $cond: [
    //                 { $lt: ['$max_watched_ep.season_number', 10] },
    //                 {
    //                   $concat: [
    //                     '0',
    //                     { $toString: '$max_watched_ep.season_number' },
    //                   ],
    //                 },
    //                 { $toString: '$max_watched_ep.season_number' },
    //               ],
    //             },
    //             'E',
    //             {
    //               $cond: [
    //                 { $lt: ['$max_watched_ep.episode_number', 10] },
    //                 {
    //                   $concat: [
    //                     '0',
    //                     { $toString: '$max_watched_ep.episode_number' },
    //                   ],
    //                 },
    //                 { $toString: '$max_watched_ep.episode_number' },
    //               ],
    //             },
    //           ],
    //         },
    //         else: null,
    //       },
    //     },
    //   },
    // },
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
                  $and: [
                    { $gt: ['$count_watched', 0] },
                    { $ne: ['$count_watched', '$tv.number_of_episodes'] },
                    {
                      $eq: [
                        '$max_watched_ep.season_number',
                        '$tv.last_episode_to_air.season_number',
                      ],
                    },
                    {
                      $eq: [
                        '$max_watched_ep.episode_number',
                        '$tv.last_episode_to_air.episode_number',
                      ],
                    },
                  ],
                },
                then: 'waiting_next_ep',
                else: {
                  $cond: {
                    if: { $gt: ['$count_watched', 0] },
                    then: 'watching',
                    else: 'watchlist',
                  },
                },
              },
            },
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
        is_anime: '$tv.is_anime',
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
        max_watched_ep: 1,
        next_episode_to_air: '$tv.next_episode_to_air',
        last_episode_to_air: '$tv.last_episode_to_air',
        // latest_watched_formatted: 1,
        // next_ep_formatted: 1,
        seasons: '$tv.seasons',
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

    if (payload?.is_anime !== undefined) {
      matchQuery.push({ is_anime: payload?.is_anime });
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
