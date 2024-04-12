import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Cron } from '@nestjs/schedule';
import { LineService } from 'src/line/line.service';
import { AuthService } from 'src/auth/auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Movie, MovieDocument } from './schema/movie.schema';
import { Model } from 'mongoose';
import { TV, TVDocument } from './schema/tv.schema';
import { TMDBService } from './tmdb.service';
import axios from 'axios';
import { pickBy, range, startsWith, toArray } from 'lodash';
import * as fs from 'node:fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gz = require('gunzip-file');
import { tsvJSON } from 'src/shared/helpers';

@Injectable()
export class MediasService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<MovieDocument>,
    @InjectModel(TV.name) private tvModel: Model<TVDocument>,
    private tmdbService: TMDBService,
    @Inject(forwardRef(() => LineService))
    private lineService: LineService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}

  async create(createMediaDto: any, mediaType: string) {
    const id = createMediaDto?.id || '';
    if (mediaType === 'movie') {
      const findMedia = await this.movieModel.find({ id });
      if (!findMedia) {
        await this.movieModel.create(createMediaDto);
      } else {
        await this.movieModel.updateOne({ id }, createMediaDto);
      }
    } else {
      const findMedia = await this.tvModel.find({ id });
      if (!findMedia) {
        await this.tvModel.create(createMediaDto);
      } else {
        await this.tvModel.updateOne({ id }, createMediaDto);
      }
    }
  }

  async findAll(userId: string, mediaType: string) {
    // const a = await this.tmdbService.accountMovieWatchlist();
    let resp: Movie[] | TV[] = [];
    if (mediaType === 'movie') {
      resp = await this.movieModel.find({ user_id: userId });
    } else {
      resp = await this.tvModel.find({ user_id: userId });
    }

    return {
      results: resp,
      total_results: resp.length,
      total_pages: 1,
    };
  }

  findOne(id: string, userId: string, mediaType: string) {
    if (mediaType === 'movie') {
      return this.movieModel.findOne({ id: id, user_id: userId });
    } else {
      return this.tvModel.findOne({ id: id, user_id: userId });
    }
  }

  async update(id: string, updateMediaDto: UpdateMediaDto, mediaType: string) {
    if (mediaType === 'movie') {
      await this.movieModel.updateOne({ id }, updateMediaDto);
    } else {
      await this.tvModel.updateOne({ id }, updateMediaDto);
    }
  }

  async remove(id: string, mediaType: string) {
    if (mediaType === 'movie') {
      await this.movieModel.deleteOne({ id: id });
      return;
    } else {
      await this.tvModel.deleteOne({ id: id });
      return;
    }
  }

  @Cron('12 2 * * *')
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

  async getImdbRating(imdbId: string) {
    const fileData = fs.readFileSync('imdb.json', { encoding: 'utf-8' });
    const imdbData: any[] = JSON.parse(fileData);
    const findRating = imdbData.find((val: any) => val.id === imdbId);
    if (!findRating) {
      return;
    }

    return findRating;
  }

  @Cron('20 2 * * *')
  async updateIMDBDetail() {
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
    const gzFileName = 'imdb-rating.tsv.gz';
    const tsvFileName = 'imdb-rating.tsv';
    // FileDownload(res, gzFileName);
    fs.writeFileSync(gzFileName, res.data, { encoding: 'binary' });
    gz(gzFileName, tsvFileName, async () => {
      const tsv = fs.readFileSync(tsvFileName, 'utf-8');
      const resJSON = tsvJSON(tsv.toString());

      const datas = resJSON.map((imdbData) => {
        return {
          id: imdbData.tconst,
          rating: Number(imdbData.averageRating),
          votes: Number(imdbData.numVotes),
        };
      });

      fs.writeFileSync('imdb.json', JSON.stringify(datas));

      // Remove file
      fs.unlinkSync(gzFileName);
      fs.unlinkSync(tsvFileName);

      console.log('end');
    });
  }
}
