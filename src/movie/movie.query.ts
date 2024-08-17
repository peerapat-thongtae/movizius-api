// import { Injectable } from '@nestjs/common';
// import { Movie } from '../movie/entities/movie.entity';
// import { MovieUser } from '../movie/entities/movie_user.entity';
// import { Repository } from 'typeorm';
// import { InjectRepository } from '@nestjs/typeorm';

// @Injectable()
// export class MovieQueryBuilder {
//   constructor(
//     @InjectRepository(Movie)
//     private movieRepository: Repository<Movie>,

//     @InjectRepository(MovieUser)
//     private movieUserRepository: Repository<MovieUser>,
//   ) {}
//   queryMovie() {
//     const qb = this.movieRepository.createQueryBuilder('movie');
//     qb.leftJoin('movie.users', 'movie_user');
//     qb.select([
//       'movie.id as id',
//       `'movie' as media_type`,
//       'movie.is_anime as is_anime',
//       'movie_user.id as account_state_id',
//       'movie_user.watchlisted_at as watchlisted_at',
//       'movie_user.watched_at as watched_at',
//     ]);

//     qb.addSelect(
//       `CASE
//         WHEN watchlisted_at is not null and watched_at is null THEN 'watchlist'
//         WHEN watched_at is not null THEN 'watched'
//         ELSE ''
//         END as account_status`,
//     );

//     return qb;
//   }
// }
