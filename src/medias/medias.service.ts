import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LineService } from 'src/line/line.service';
import { AuthService } from 'src/auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TMDBService } from './tmdb.service';
import { getDownloadUrl, list } from '@vercel/blob';
import axios from 'axios';
import {
  pickBy,
  range,
  startsWith,
  toArray,
  chunk,
  orderBy,
  take,
} from 'lodash';
import * as fs from 'node:fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gz = require('gunzip-file');
import { tsvJSON } from '../shared/helpers';
import { Media, MediaDocument } from './schema/medias.schema';
import { Imdb, ImdbDocument } from './schema/imdb.schema';
import { HttpService } from '@nestjs/axios';
// import zlib from 'zlib';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const zlib = require('zlib');

@Injectable()
export class MediasService {
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

  async create(createMediaDto: any, mediaType: string) {
    const id = createMediaDto?.id || '';
    const findMedia = await this.mediaModel.find({ id, media_type: mediaType });
    if (!findMedia) {
      await this.mediaModel.create({
        ...createMediaDto,
        media_type: mediaType,
      });
    } else {
      await this.mediaModel.updateOne(
        { id, media_type: mediaType },
        createMediaDto,
      );
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

  findOne(id: string, userId: string, mediaType: string) {
    return this.mediaModel.findOne({
      id: id,
      user_id: userId,
      media_type: mediaType,
    });
  }

  async update(id: string, updateMediaDto: UpdateMediaDto, mediaType: string) {
    await this.mediaModel.updateOne(
      { id, media_type: mediaType },
      updateMediaDto,
    );
  }

  async remove(id: string, mediaType: string) {
    await this.mediaModel.deleteOne({ id: id, media_type: mediaType });
    return;
  }

  @Cron('36 13 * * *')
  async sendNotificationsToLine() {
    const respUser = await this.authService.findAll();
    const users = respUser.data;
    const findLineUsers = users.filter((val) => {
      return val.identities.find((iden) => iden.provider === 'line');
    });

    for (const user of findLineUsers) {
      const userIdentity = user.identities?.find(
        (val) => val.provider === 'line',
      );
      console.log('1');
      this.lineService.pushMessage(userIdentity.user_id, {
        type: 'text',
        text: 'test',
      });
    }

    return;
  }

  async test() {
    console.log('start');
    console.log(await this.getImdbRating('tt0137523'));
  }

  async getAllImdbRatings() {
    const listFiles = await list();

    const data = await this.httpService.axiosRef.get(
      listFiles.blobs?.[0].downloadUrl,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    );

    return take(data.data, 4);
  }

  async getImdbRating(imdbId: string) {
    // const { url } = await get('articles/blob.txt', 'Hello World!', { access: 'public' });
    const fileData = fs.readFileSync('imdb.json', 'utf-8');
    const imdbs = JSON.parse(fileData);
    // const imdbData: any[] = JSON.parse(fileData);
    const findRating = imdbs.find((val: any) => val.id === imdbId);
    if (!findRating) {
      return;
    }

    // return findRating;
  }

  // @Cron('18 10 * * *')
  async updateIMDBDetail() {
    try {
      console.log('start imdb');
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

        const sortDatas = orderBy(datas, 'votes', 'desc');
        const newa = chunk(sortDatas, 10000);

        datasRes = resJSON;

        await this.imdbModel.create(
          newa.map((val) => {
            return {
              ratings: JSON.stringify(val),
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
}
