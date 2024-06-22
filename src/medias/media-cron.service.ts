import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { Model } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { LineService } from '../line/line.service';
import { MediasService } from '../medias/medias.service';
import { Imdb, ImdbDocument } from '../medias/schema/imdb.schema';
import { Media, MediaDocument } from '../medias/schema/medias.schema';
import { TMDBService } from '../medias/tmdb.service';
import { tsvJSON } from '../shared/helpers';
import * as fs from 'node:fs';
import { chunk, first, last, orderBy } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const zlib = require('zlib');

@Injectable()
export class MediaCronService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<MediaDocument>,
    @InjectModel(Imdb.name) private imdbModel: Model<ImdbDocument>,
    // @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    // @InjectModel(TV.name) private tvModel: Model<TVDocument>,
    private readonly httpService: HttpService,
    private tmdbService: TMDBService,
    private mediaService: MediasService,
    @Inject(forwardRef(() => LineService))
    private lineService: LineService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
  @Cron('01 22 * * *')
  async sendNotificationsToLine() {
    try {
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
      // this.logger.error(err);
    }
  }
  @Cron('29 13 * * *')
  async updateNumberOfSeasonAndEpisodes() {
    const resp: Media[] = await this.mediaModel.find({
      // user_id: userId,
      media_type: 'tv',
    });
    for (const media of resp) {
      const detail = await this.tmdbService.tvInfo(media.id);
      await this.mediaService.update(
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
  @Cron('48 14 * * *')
  async updateMovies() {
    const resp: Media[] = await this.mediaModel.find({
      // user_id: userId,
      media_type: 'movie',
    });
    for (const media of resp) {
      const detail = await this.tmdbService.movieInfo(media.id);
      const res = await this.mediaService.update(
        media.id,
        {
          name: detail.title,
          watched_at:
            media.watched && !media.watched_at
              ? media.updated_at
              : media.watched_at,
        },
        'movie',
      );
    }
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

      let datasRes: unknown;
      // Calling gunzip method
      await zlib.gunzip(res.data, async (err, buffer) => {
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
        const chunkDatas = chunk(sortDatas, 1000);

        datasRes = resJSON;

        await this.imdbModel.create(
          chunkDatas.map((val) => {
            return {
              ratings: JSON.stringify(val),
              ids: val.map((data) => data.id),
              min_id: first(val).id,
              max_id: last(val).id,
            };
          }),
        );
        // await this.imdbModel.insertMany(datas);
      });

      return datasRes;
    } catch (err) {
      return err;
    }
  }
}
