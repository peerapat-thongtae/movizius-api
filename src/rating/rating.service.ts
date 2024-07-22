import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { chunk, orderBy, take } from 'lodash';
import { first, last } from 'lodash';
import { tsvJSON } from '../shared/helpers';
import * as fs from 'node:fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from 'src/rating/entities/rating.entity';
import { Repository } from 'typeorm';
import { from as copyFrom } from 'pg-copy-streams';
import { Readable } from 'node:stream';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const zlib = require('zlib');

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
  ) {}

  async findAll() {
    return this.ratingRepository.find();
  }

  async findByImdbId(imdb_id: string) {
    const qb = this.ratingRepository.createQueryBuilder('rating');

    // qb.where('rating.max_id >= :id', { id: imdb_id });
    qb.where(`:id = ANY(rating.ids)`, { id: imdb_id });
    qb.limit(1);
    qb.select('rating.ratings as rating');
    const res = await qb.getRawOne();
    if (!res?.rating) {
      return null;
    }

    const findImdb = res.rating.find((val) => val.imdb_id === imdb_id);
    if (!findImdb) {
      return null;
    }
    return findImdb;
  }
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

      let datasRes: unknown;
      // Calling gunzip method
      await zlib.gunzip(res.data, async (err, buffer) => {
        const resJSON = tsvJSON(buffer.toString());
        fs.writeFileSync('imdb.json', JSON.stringify(resJSON));

        const datas = resJSON
          .map((imdbData) => {
            return {
              imdb_id: imdbData.tconst,
              vote_average: Number(imdbData.averageRating) || 0,
              vote_count: Number(imdbData.numVotes) || 0,
            };
          })
          .filter(
            (val) =>
              val.imdb_id && val.vote_count > 100 && val.vote_average > 2,
          );

        const sortDatas = orderBy(datas, 'imdb_id', 'asc');
        const chunkDatas = chunk(sortDatas, 1000);
        // console.log(sortDatas);
        await this.deleteAll();

        const ratings = chunkDatas.map((val) => {
          return this.ratingRepository.create({
            ids: val.map((data) => data.imdb_id),
            max_id: last(val).imdb_id,
            ratings: val,
          });
        });

        await this.ratingRepository.save(ratings);
        //
        // for (const data of sortDatas) {
        //   const rating = this.ratingRepository.create(data);
        //   await this.ratingRepository.save(rating);
        // }
        // const rating = sortDatas.map((val) =>
        //   this.ratingRepository.create(val),
        // );
        // await this.ratingRepository.save(rating);
        // console.log(sortDatas.length);
        // let query =
        //   'INSERT INTO rating (imdb_id, vote_average, vote_count) VALUES \r\n';
        // for (const data of sortDatas) {
        //   query += `('${data.imdb_id}', ${data.vote_average}, ${data.vote_count}); \r\n`;
        // }

        // await this.ratingRepository.query(query);

        // datasRes = sortDatas;
      });

      return datasRes;
    } catch (err) {
      return err;
    }
  }

  async deleteAll() {
    const qb = this.ratingRepository.createQueryBuilder('rating');
    return qb.delete().from(Rating).where('rating.id is not null').execute();
  }
}
