import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { chunk, first, last, orderBy, take } from 'lodash';
import { tsvJSON } from '../shared/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Imdb } from '../rating/schema/imdb.schema';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Imdb.name)
    private ratingModel: Model<Imdb>,
  ) {}

  async findAll() {
    const res = await this.ratingModel.find();
    return res.map((val) => val.ratings);
  }

  async findByImdbIds(imdb_ids: string[]): Promise<any[]> {
    const res = await this.ratingModel.find({ ids: imdb_ids });
    if (!res) {
      return null;
    }
    const ratings = [];
    for (const imdbData of res) {
      const ratingData = JSON.parse(imdbData.ratings);
      const filterImdb = ratingData.filter((val) =>
        imdb_ids.includes(val.imdb_id),
      );
      ratings.push(...filterImdb);
    }
    return ratings;
  }

  async findByImdbId(imdb_id: string): Promise<any> {
    const res = await this.ratingModel.findOne({
      $and: [
        {
          max_id: { $gte: imdb_id },
        },
        {
          min_id: { $lte: imdb_id },
        },
      ],
    });
    if (!res) {
      return null;
    }
    const ratings = JSON.parse(res.ratings);
    const findImdb = ratings.find((val) => val.imdb_id === imdb_id);
    if (!findImdb) {
      return null;
    }
    return findImdb;
  }

  async updateIMDBDetail() {
    console.log('start imdb');
    const start = performance.now();
    const res = await axios.get(
      'https://datasets.imdbws.com/title.ratings.tsv.gz',
      {
        responseType: 'arraybuffer', // Important
        headers: {
          'Content-Type': 'application/gzip',
        },
      },
    );

    // Calling gunzip method
    // await zlib.gunzip(res.data, async (err, buffer) => {});

    const buffer = await new Promise((resolve, reject) => {
      zlib.gunzip(res.data, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });

    const resJSON = tsvJSON(buffer.toString());
    const datas = resJSON
      .map((imdbData) => {
        return {
          id: imdbData.tconst,
          imdb_id: imdbData.tconst,
          vote_average: Number(imdbData.averageRating) || 0,
          vote_count: Number(imdbData.numVotes) || 0,
        };
      })
      .filter((val) => val.id && val.vote_count > 100 && val.vote_average > 2);

    await this.ratingModel.deleteMany();

    const sortDatas = orderBy(datas, 'votes', 'desc');
    const newa = chunk(sortDatas, 1500);

    await this.ratingModel.insertMany(
      newa.map((val) => {
        return {
          // ids: JSON.stringify(val.map((data) => data.imdb_id)),
          ratings: JSON.stringify(val),
          min_id: first(val)?.imdb_id,
          max_id: last(val)?.imdb_id,
          // updated_at: new Date(),
        };
      }),
    );
    const end = performance.now();
    console.log('end imdb', new Date(end - start).getSeconds());
    return 9;
  }
}
