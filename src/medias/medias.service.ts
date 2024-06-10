import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LineService } from 'src/line/line.service';
import { AuthService } from 'src/auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { TMDBService } from './tmdb.service';
import axios from 'axios';
import { ceil, chunk, first, last, orderBy, take, uniqBy } from 'lodash';
import * as fs from 'node:fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const csvToJson = require('convert-csv-to-json');

import { csvJSON, tsvJSON } from '../shared/helpers';
import { Media, MediaDocument } from './schema/medias.schema';
import { Imdb, ImdbDocument } from './schema/imdb.schema';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
// import zlib from 'zlib';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zlib = require('zlib');

@Injectable()
export class MediasService {
  private readonly logger = new Logger(MediasService.name);
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @InjectModel(Imdb.name) private imdbModel: Model<ImdbDocument>,
    // @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    // @InjectModel(TV.name) private tvModel: Model<TVDocument>,
    private readonly httpService: HttpService,
    private tmdbService: TMDBService,
    @Inject(forwardRef(() => LineService))
    private lineService: LineService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async create(createMediaDto: any, mediaType: string, userId: string) {
    const id = createMediaDto?.id || '';
    const findMedia = await this.mediaModel.findOne({
      id,
      media_type: mediaType,
      user_id: userId,
    });

    if (mediaType === 'movie') {
      const objStatus = {
        watchlist: false,
        watched: false,
      };

      if (createMediaDto.status === 'watchlist') {
        objStatus.watchlist = true;
        objStatus.watched = false;
      } else if (createMediaDto.status === 'watched') {
        objStatus.watchlist = false;
        objStatus.watched = true;
      }

      if (!findMedia) {
        const payload = {
          id,
          media_type: mediaType,
          user_id: userId,
          ...objStatus,
        };
        return this.mediaModel.create(payload);
        return payload;
      } else {
        return await this.update(id, objStatus, mediaType, userId);
      }
    } else {
      if (createMediaDto.status === 'watched') {
        const detail = await this.tmdbService.tvInfo(createMediaDto.id);

        const ep_watched = [];
        const filterSeasons = detail.seasons.filter(
          (val) => val.season_number !== 0,
        );
        for (const season of filterSeasons) {
          for (let i = 1; i <= season.episode_count; i++) {
            const findWatched = findMedia
              ? findMedia.episode_watched.find(
                  (val) =>
                    val.season_number === season.season_number &&
                    val.episode_number === i,
                )
              : null;
            if (!findWatched) {
              ep_watched.push({
                season_number: season.season_number,
                episode_number: i,
                watched_at: new Date(),
              });
            }
          }
        }

        if (findMedia) {
          const res = await this.update(
            createMediaDto.id,
            { episode_watched: ep_watched },
            'tv',
            userId,
          );
        } else {
          const resp = await this.mediaModel.create({
            id,
            media_type: mediaType,
            user_id: userId,
            episode_watched: ep_watched,
          });
          return resp.toJSON();
        }
      } else {
        if (!findMedia) {
          const resp = await this.mediaModel.create({
            id,
            name: createMediaDto.name,
            media_type: mediaType,
            user_id: userId,
            episode_watched: [],
            watchlisted_at: new Date(),
          });
          return resp.toJSON();
        }
      }
    }
  }
  async updateTVEpisodes(payload: any, userId: string) {
    const id = payload.id;
    let episode_watched = payload.episode_watched || [];

    episode_watched = episode_watched.map((val: any) => ({
      ...val,
      watched_at: new Date(),
    }));

    const findMedia = await this.mediaModel.findOne({
      id,
      media_type: 'tv',
    });

    if (findMedia) {
      const combineWatched = [...findMedia.episode_watched, ...episode_watched];
      const uniq = uniqBy(combineWatched, (v) =>
        [v.season_number, v.episode_number].join('-'),
      );
      return await this.update(id, { episode_watched: uniq }, 'tv', userId);
    } else {
      const payload = {
        id,
        media_type: 'tv',
        user_id: userId,
        episode_watched: episode_watched,
        watchlisted_at: new Date(),
      };
      const resp = await this.mediaModel.create(payload);
      return payload;
    }
  }

  async findAll(userId: string, mediaType: string) {
    // const a = await this.tmdbService.accountMovieWatchlist();
    const resp: Media[] = await this.mediaModel.find({
      user_id: userId,
      media_type: mediaType,
    });

    return {
      results: resp,
      total_results: resp.length,
      total_pages: 1,
    };
  }

  async paginateByStatus(
    userId: string,
    mediaType: string,
    status: string,
    page: number,
  ) {
    // const a = await this.tmdbService.accountMovieWatchlist();
    const skip = 20 * page;
    const limit = 20;
    const total = await this.mediaModel.find({
      user_id: userId,
      media_type: mediaType,
      watchlist: status === 'watchlist',
      watched: status === 'watched',
    });
    const resp: Media[] = await this.mediaModel.find(
      {
        user_id: userId,
        media_type: mediaType,
        watchlist: status === 'watchlist',
        watched: status === 'watched',
      },
      {},
      { skip: skip, limit: limit },
    );

    return {
      results: resp,
      total_results: total.length,
      total_pages: total.length / 20,
    };
  }

  async paginateTVWatching(userId: string, page: number = 1) {
    const limit = 20;
    const skip = limit * (page - 1);
    const query: PipelineStage[] = [
      {
        $addFields: {
          latest_watch: { $max: '$episode_watched.watched_at' },
          count_watched: { $size: '$episode_watched' },
        },
      },
      {
        $match: {
          $and: [
            { user_id: userId },
            { media_type: 'tv' },
            { 'episode_watched.0': { $exists: true } },
            // { $expr: { $eq: ['$count_watched', '$number_of_episodes'] } }, Watched
            { $expr: { $lt: ['$count_watched', '$number_of_episodes'] } },
          ],
        },
      },
      {
        $sort: { 'episode_watched.watched_at': -1 },
      },
    ];

    const paginatationQuery: PipelineStage[] = [
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const totalQuery = await this.mediaModel.aggregate(query);
    const filter: Media[] = await this.mediaModel.aggregate([
      ...query,
      ...paginatationQuery,
    ]);

    return {
      results: filter,
      total_results: totalQuery.length,
      total_pages: ceil(totalQuery.length / limit),
    };
  }

  async random(
    userId: string,
    mediaType: string,
    randomSize: number = 10,
    status?: string,
  ) {
    // const a = await this.tmdbService.accountMovieWatchlist();
    const resp: Media[] = await this.mediaModel.aggregate([
      {
        $match: {
          $and: [
            { user_id: userId },
            { media_type: mediaType },
            status && {
              watchlist: status === 'watchlist',
              watched: status === 'watched',
            },
          ],
        },
      },
      { $sample: { size: randomSize } },
    ]);

    return {
      results: resp,
      total_results: resp.length,
      total_pages: 1,
    };
  }

  findOne(id: string, userId: string, mediaType: string) {
    return this.mediaModel.findOne({
      id: id,
      user_id: userId,
      media_type: mediaType,
    });
  }

  async getMediaByStatus(
    media_type: string,
    status: 'watchlist' | 'watched' | 'watching',
  ) {
    const findObj = {
      media_type,
      watchlist: status === 'watchlist' ? true : false,
      watched: status === 'watched' ? true : false,
    };
    const medias = await this.mediaModel.find(findObj);
    return medias;
  }

  async update(
    id: string,
    updateMediaDto: any,
    mediaType: string,
    userId?: string,
  ) {
    const resp = await this.mediaModel.findOneAndUpdate(
      { id, media_type: mediaType, user_id: userId },
      updateMediaDto,
      { new: true },
    );
    return resp;
  }

  async remove(id: string, mediaType: string) {
    await this.mediaModel.deleteOne({ id: id, media_type: mediaType });
    return;
  }

  @Cron('01 22 * * *')
  async sendNotificationsToLine() {
    try {
      this.logger.warn('start line noti');
      const respUser = await this.authService.findAll();
      const users = respUser.data;
      const findLineUsers = users.filter((val) => {
        return val.identities.find((iden) => iden.provider === 'line');
      });

      for (const user of findLineUsers) {
        const userIdentity = user.identities?.find(
          (val) => val.provider === 'line',
        );
        this.lineService.pushMessage(userIdentity.user_id, {
          type: 'text',
          text: 'test',
        });
      }

      return;
    } catch (err) {
      this.logger.error(err);
    }
  }
  @Cron('29 13 * * *')
  async test() {
    const resp: Media[] = await this.mediaModel.find({
      // user_id: userId,
      media_type: 'tv',
    });

    for (const media of resp) {
      const detail = await this.tmdbService.tvInfo(media.id);
      await this.update(
        media.id,
        {
          name: detail.name,
          number_of_seasons: detail.number_of_seasons,
          number_of_episodes: detail.number_of_episodes,
        },
        'tv',
      );
    }
  }
  @Cron('44 13 * * *')
  async updateMovies() {
    const resp: Media[] = await this.mediaModel.find({
      // user_id: userId,
      media_type: 'movie',
    });

    for (const media of resp) {
      const detail = await this.tmdbService.movieInfo(media.id);
      await this.update(
        media.id,
        {
          name: detail.title,
        },
        'movie',
      );
    }
  }

  async getAllImdbRatings() {
    const ratings = await this.imdbModel.find();
    return ratings;
  }

  async getImdbRatingByIds(imdbIds: string[]) {
    const resp = await this.imdbModel.find({
      ids: { $in: imdbIds },
    });

    const imdbDatas = [];
    for (const row of resp) {
      const ratings = JSON.parse(row.ratings);
      const findRatings = ratings.filter((val) => imdbIds.includes(val.id));
      imdbDatas.push(...findRatings);
    }
    return imdbDatas;
  }

  async getImdbRating(imdbId: string) {
    const resp = await this.imdbModel.findOne({
      ids: { $in: [imdbId] },
    });

    if (!resp) {
      return;
    }

    const imdbDatas = JSON.parse(resp.ratings);
    const findRating = imdbDatas.find((val: any) => val.id === imdbId);
    if (!findRating) {
      return;
    }

    return findRating;
  }

  @Cron('40 19 * * *')
  async updateIMDBDetail() {
    try {
      const res = await axios.get(
        'https://datasets.imdbws.com/title.ratings.tsv.gz',
        {
          responseType: 'arraybuffer', // Important
          headers: {
            'Content-Type': 'application/gzip',
          },
        },
      );

      await this.imdbModel.deleteMany();

      let datasRes: any;
      // Calling gunzip method
      await zlib.gunzip(res.data, async (err, buffer) => {
        // console.log(buffer.toString('utf8'));
        // fs.writeFileSync(tsvFileName, buffer);
        const resJSON = tsvJSON(buffer.toString());
        fs.writeFileSync('imdb.json', JSON.stringify(resJSON));

        const datas = resJSON
          .map((imdbData) => {
            return {
              id: imdbData.tconst,
              rating: Number(imdbData.averageRating) || 0,
              votes: Number(imdbData.numVotes) || 0,
            };
          })
          .filter((val) => val.id && val.votes > 100 && val.rating > 2);

        const sortDatas = orderBy(datas, 'id', 'asc');
        const newa = chunk(sortDatas, 1000);

        datasRes = resJSON;

        await this.imdbModel.create(
          newa.map((val) => {
            return {
              ratings: JSON.stringify(val),
              ids: val.map((data) => data.id),
              min_id: first(val).id,
              max_id: last(val).id,
            };
          }),
        );
        console.log('end');
        // await this.imdbModel.insertMany(datas);
      });

      return datasRes;
    } catch (err) {
      return err;
    }
  }

  async updatetest() {
    // return res.data;
    const arr = csvToJson.fieldDelimiter(',').getJsonFromCsv('ratings.csv');

    // TV Episodes
    const case1 = arr.filter((val) => val.Type === 'tv' && val.EpisodeNumber);
    for (let i = 0; i < case1.length; i++) {
      const tv = case1[i];
      const resp = await this.mediaModel.aggregate([
        { $match: { 'episode_watched.episode_id': +tv.TMDbID } },
      ]);
      const media = resp?.[0];
      if (media) {
        const newEP = [];
        for (const ep of media.episode_watched) {
          if (ep.episode_id === +tv.TMDbID) {
            if (tv.DateRated) {
              ep.watched_at = new Date(tv.DateRated);
            }
          }
          newEP.push(ep);
        }

        await this.mediaModel.findOneAndUpdate(
          {
            id: media.id,
            media_type: 'tv',
          },
          { episode_watched: newEP },
          { new: true },
        );
      }
    }

    return case1;
  }

  async updateEPNumber() {
    const medias = await this.mediaModel.find({ media_type: 'tv' });
    for (const media of medias) {
      if (media.episode_watched.length > 0) {
        const newEP = [];
        let notId = false;

        if (media.episode_watched.find((val) => !val.episode_id)) {
          const eps = [];
          for (let i = 1; i <= media.number_of_seasons; i++) {
            const ss = await this.tmdbService
              .seasonInfo({
                season_number: i,
                id: media.id,
              })
              .catch(() => null);

            if (ss) {
              eps.push(...ss.episodes);
            }
          }
          for (const ep of media.episode_watched) {
            if (!ep.episode_id) {
              const info = eps.find(
                (val) =>
                  val.episode_number === ep.episode_number &&
                  val.season_number === ep.season_number,
              );
              if (info) {
                ep.episode_id = info?.id;
              }
              notId = true;
              newEP.push(ep);
            } else {
              newEP.push(ep);
            }
          }
          if (notId) {
            await this.mediaModel.findOneAndUpdate(
              {
                id: media.id,
                media_type: 'tv',
              },
              { episode_watched: newEP },
              { new: true },
            );
          }
        }
      }
    }
    return medias.length;
  }
}
