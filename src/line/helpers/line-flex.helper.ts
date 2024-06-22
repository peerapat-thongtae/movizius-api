import { FlexBubble, FlexCarousel, FlexMessage } from '@line/bot-sdk';
import { MovieResponse, ShowResponse } from 'moviedb-promise';
import { MediaTypeEnum } from '../../medias/enum/media-type.enum';

export const movieDetailFlex = (
  movie: MovieResponse & ShowResponse,
  media_type: MediaTypeEnum,
): FlexMessage => {
  return {
    altText: movie.title,
    type: 'flex',
    contents: movieDetailCardLine({
      id: movie.id,
      mediaType: media_type,
      poster_path: movie.poster_path,
      name: movie.name || movie.title,
      release_date: movie.release_date || movie.first_air_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      streamingName: '',
    }),
  };
};

export type IMovieLineCard = {
  id: string | number;
  mediaType: MediaTypeEnum;
  poster_path: string;
  name: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  streamingName: string;
  note?: string;
  watchUrl?: string;
};

export const movieDetailCardLine = (movie: IMovieLineCard): FlexBubble => {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: `https://www.themoviedb.org/t/p/w780/${movie.poster_path}`,
          size: 'full',
          aspectMode: 'cover',
          gravity: 'center',
          aspectRatio: '7:10',
          margin: 'none',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${movie?.name}`,
                  size: 'xl',
                  color: '#000000',
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `Release : ${movie?.release_date}`,
                  color: '#000000',
                  size: 'sm',
                },
              ],
              paddingTop: '15px',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `Rating : ${movie?.vote_average} (${movie?.vote_count} votes)`,
                  color: '#000000',
                  size: 'sm',
                },
              ],
              paddingTop: '15px',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `Streaming : ${movie?.streamingName}`,
                  color: '#000000',
                  size: 'sm',
                },
              ],
              paddingTop: '15px',
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: `Note : ${movie?.note}`,
                  color: '#000000',
                  size: 'sm',
                },
              ],
              paddingTop: '15px',
            },
            // {
            //   type: 'box',
            //   layout: 'vertical',
            //   action: {
            //     label: 'Detail',
            //     type: 'uri',
            //     uri: `http://localhost:3000/${movie.mediaType.toLowerCase()}/${movie.id}`,
            //   },
            //   contents: [
            //     {
            //       type: 'filler',
            //     },
            //     {
            //       type: 'box',
            //       layout: 'baseline',
            //       contents: [
            //         {
            //           type: 'filler',
            //         },
            //         {
            //           type: 'text',
            //           text: 'Detail',
            //           color: '#000000',
            //           offsetTop: '-2px',
            //         },
            //         {
            //           type: 'filler',
            //         },
            //       ],
            //       spacing: 'sm',
            //     },
            //     {
            //       type: 'filler',
            //     },
            //   ],
            //   borderWidth: '1px',
            //   cornerRadius: '4px',
            //   spacing: 'sm',
            //   borderColor: '#000000',
            //   margin: 'xxl',
            //   height: '40px',
            // },
          ],
          position: 'relative',
          offsetBottom: '0px',
          offsetStart: '0px',
          offsetEnd: '0px',
          paddingAll: '20px',
          backgroundColor: '#ffffff',
          borderWidth: 'none',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: movie.mediaType,
              color: '#ffffff',
              align: 'center',
              size: 'xs',
              offsetTop: '4px',
            },
          ],
          position: 'absolute',
          cornerRadius: '20px',
          offsetTop: '18px',
          backgroundColor: '#ff334b',
          offsetStart: '18px',
          height: '25px',
          width: '53px',
        },
      ],
      paddingAll: '0px',
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'Detail',
            uri: `http://localhost:3000/${movie.mediaType.toLowerCase()}/${movie.id}`,
          },
        },
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'Watch',
            uri: `${movie.watchUrl}`,
          },
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [],
          margin: 'sm',
        },
      ],
    },
  };
};

export const carouselMessage = (movies: IMovieLineCard[]): FlexCarousel => {
  return {
    type: 'carousel',
    contents: movies.map((movie) => movieDetailCardLine(movie)),
  };
};
