import { MovieDb } from 'moviedb-promise';

export class TMDBService extends MovieDb {
  // private readonly movieDB: MovieDb = new MovieDb(process.env.TMDB_API_KEY);

  constructor() {
    super(process.env.TMDB_API_KEY);
  }
  async searchMovieByName(query: string, page?: number) {
    return this.searchMovie({
      query,
      page,
    });
  }
}
