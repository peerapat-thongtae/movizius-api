import { Injectable } from '@nestjs/common';
import { TMDBService } from '../medias/tmdb.service';
import { InjectModel } from '@nestjs/mongoose';
import { Schedule } from 'src/schedule-calendar/schema/schedule.schema';
import { Model } from 'mongoose';
import dayjs from 'dayjs';
import { MediasService } from '../medias/medias.service';
import { omit, omitBy, orderBy, sortBy } from 'lodash';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ScheduleCalendarService {
  constructor(
    @InjectModel(Schedule.name)
    private scheduleModel: Model<Schedule>,
    private tmdbService: TMDBService,
    private mediaService: MediasService,
    private httpService: HttpService,
  ) {}

  async updateTVCalendar() {
    const key = 'TV_AIRING_CALENDAR';
    const date = dayjs().format('YYYY-MM-DD');
    const tvAiringObj = await this.scheduleModel.findOne({ key, date });
    // 0-5 12 * * *
    const getFunc = async (page: number) => {
      const tvs = await this.tmdbService.discoverTv({
        page: page,
        with_type: '2|4',
        without_genres: `${['10763', '10764', '10766', '10767'].join(',')}`,
        'air_date.gte': date,
        'air_date.lte': date,
        timezone: 'Asia/Bangkok',
      } as any);

      tvs.results = tvs.results.filter((val) => {
        return (
          val.genre_ids.length > 0 &&
          [
            'th',
            'en',
            'us',
            'da',
            'kr',
            'jp',
            'no',
            'de',
            'pl',
            'nl',
            'ga',
            'la',
            'ru',
          ].includes(val.original_language)
        );
      });
      const results = await Promise.all(
        tvs.results.map((val) =>
          this.mediaService.getTVInfo(val.id).catch(() => null),
        ),
      );

      return {
        ...tvs,
        total_results: (tvAiringObj?.total_results || 0) + results.length,
        results: results.map((val) =>
          omit(
            {
              ...val,
              has_th_streaming: val.watch_providers.results?.['TH']
                ? true
                : false,
              watch_th: val.watch_providers.results?.['TH'] || null,
            },
            ['adult', 'homepage', 'credits', 'watch_providers', 'seasons'],
          ),
        ),
      };
    };

    if (tvAiringObj) {
      if (tvAiringObj.latest_page < tvAiringObj.total_pages) {
        const tvs = await getFunc(tvAiringObj.latest_page + 1);
        return await this.scheduleModel.updateOne(
          { _id: tvAiringObj._id },
          {
            date: date,
            medias: [...tvAiringObj.medias, ...tvs.results],
            latest_page: tvs.page,
            total_pages: tvs.total_pages,
            total_results: tvs.total_results,
            updated_at: new Date(),
          },
        );
      } else {
        if (!tvAiringObj.sended) {
          const tvs = tvAiringObj.medias
            .map((val) => {
              return {
                ...val,
              };
            })
            .sort(
              (a, b) => parseFloat(b.popularity) - parseFloat(a.popularity),
            );
          let tvDescription = '';
          if (tvs.length > 0) {
            for (const [index, tv] of tvs.entries()) {
              const streaming =
                tv?.watch_th?.flatrate?.[0]?.provider_name || '';

              const EPText = tv.last_episode_to_air
                ? `Season ${tv.last_episode_to_air.season_number} EP. ${tv.last_episode_to_air.episode_number}`
                : '';
              tvDescription += `${index + 1}. [${tv.name}](${process.env.WEB_MEDIA_URL}/tv/${tv.id}) ${EPText && `: **${EPText}**`} ${streaming && `| **${streaming}**`} \n`;
            }
          } else {
            tvDescription = 'No tv series release today';
          }
          await lastValueFrom(
            this.httpService.post(process.env.DISCORD_WEBHOOK_TV_ROOM, {
              embeds: [
                {
                  title: `TV Release Today : ${dayjs(date).format('DD MMMM YYYY')}`,
                  description: tvDescription,
                },
              ],
            }),
          );

          await this.scheduleModel.updateOne(
            { _id: tvAiringObj._id },
            { sended: true },
          );
        }
      }
    } else {
      const tvs = await getFunc(1);
      return await this.scheduleModel.create({
        key,
        date: date,
        medias: [...tvs.results],
        latest_page: tvs.page,
        total_pages: tvs.total_pages,
        total_results: tvs.total_results,
        updated_at: new Date(),
      });
    }
  }
}