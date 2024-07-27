import { Injectable } from '@nestjs/common';
import { TVUser } from '../tv/entities/tv_user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TV } from '../tv/entities/tv.entity';

@Injectable()
export class TVQueryBuilder {
  constructor(
    @InjectRepository(TV)
    private tvRepository: Repository<TV>,

    @InjectRepository(TVUser)
    private tvUserRepository: Repository<TVUser>,
  ) {}
  queryTV() {
    const qb = this.tvRepository.createQueryBuilder('tv');
    qb.leftJoin('tv.users', 'tv_user');
    qb.select([
      'tv.id as id',
      `'tv' as media_type`,
      'tv.number_of_episodes as number_of_episodes',
      'tv.number_of_seasons as number_of_seasons',
      'tv.is_anime as is_anime',
      'tv_user.id as account_state_id',
      'tv_user.watchlisted_at as watchlisted_at',
      'tv_user.episode_watched as episode_watched',
      'jsonb_array_length(tv_user.episode_watched) as count_watched',
      `
        CASE WHEN (jsonb_array_length(tv_user.episode_watched) > 0 and jsonb_array_length(tv_user.episode_watched) < tv.number_of_episodes) THEN 'watching'
          WHEN jsonb_array_length(tv_user.episode_watched) = tv.number_of_episodes THEN 'watched'
          WHEN jsonb_array_length(tv_user.episode_watched) = 0 THEN 'watchlist'
          ELSE '' END as account_status
      `,
      'sqb.latest_watched as latest_watched',
      'CASE WHEN jsonb_array_length(tv_user.episode_watched) = tv.number_of_episodes THEN sqb.latest_watched ELSE null END as watched_at',
    ]);

    const subQuery = this.tvUserRepository
      .createQueryBuilder('subTvUser')
      .select('subTvUser.id', 'id')
      .addSelect((subQuery) => {
        return subQuery
          .select(["MAX((elem->>'watched_at')::timestamptz) as latest_watched"])
          .from((subQb) => {
            return subQb
              .select('jsonb_array_elements(myTable.episode_watched) AS elem')
              .where('subTvUser.id = myTable.id')
              .from('tv_user', 'myTable');
          }, 'subQueryLatestWatched');
      })
      .groupBy('subTvUser.id')
      .getQuery();

    qb.leftJoin(`(${subQuery})`, 'sqb', 'sqb.id = tv_user.id');

    qb.groupBy('tv.id, tv_user.id, sqb.id, sqb.latest_watched');

    return qb;
  }
}
