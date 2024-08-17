import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { chunk, last, orderBy, take } from 'lodash';
import { tsvJSON } from '../shared/helpers';
import { InjectModel } from '@nestjs/mongoose';
import { Imdb } from '../rating/schema/imdb.schema';
import { Model } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const zlib = require('zlib');

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
      const ratingData = imdbData.ratings;
      const filterImdb = ratingData.filter((val) =>
        imdb_ids.includes(val.imdb_id),
      );
      ratings.push(...filterImdb);
    }
    return ratings;
  }

  async findByImdbId(imdb_id: string): Promise<any> {
    const res = await this.ratingModel.findOne({ ids: imdb_id });
    if (!res) {
      return null;
    }
    const ratings = res.ratings;
    const findImdb = ratings.find((val) => val.imdb_id === imdb_id);
    if (!findImdb) {
      return null;
    }
    return findImdb;
  }

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

    // Calling gunzip method
    zlib.gunzip(res.data, async (err, buffer) => {
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
        .filter(
          (val) => val.id && val.vote_count > 100 && val.vote_average > 2,
        );

      await this.ratingModel.deleteMany();

      const sortDatas = orderBy(datas, 'votes', 'desc');
      const newa = chunk(sortDatas, 1500);

      await this.ratingModel.create(
        newa.map((val) => {
          return {
            ids: val.map((data) => data.imdb_id),
            ratings: val,
            max_id: last(val)?.imdb_id,
            updated_at: new Date(),
          };
        }),
      );
      console.log('end');
    });

    return;
  }
}
