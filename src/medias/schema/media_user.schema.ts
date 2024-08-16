import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { maxBy, orderBy, sortBy } from 'lodash';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type MediaUserDocument = MediaUser & Document;

@Schema()
export class MediaUser {
  @Prop({ type: Number, index: true, required: true })
  media_id: number;

  @Prop({ type: String, index: true, required: true })
  media_type: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  @Prop({ type: Boolean, default: true })
  watchlist: boolean;

  @Prop({ type: Boolean, default: false })
  watched: boolean;

  @Prop({ type: Types.Array, default: [] })
  episode_watched: {
    episode_id?: number;
    season_number: number;
    episode_number: number;
    watched_at: Date;
  }[];

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
    index: true,
  })
  watchlisted_at: Date;

  @Prop({
    type: Date,
    required: false,
    index: true,
  })
  watched_at: Date;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const MediaUserSchema = SchemaFactory.createForClass(MediaUser);
MediaUserSchema.plugin(paginate);
MediaUserSchema.index({ id: 1, media_type: 1, user_id: 1 }, { unique: true });
MediaUserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    ret.account_status = '';
    ret.latest_watched = maxBy(ret.episode_watched, 'watched_at') || null;
    if (ret.media_type === 'movie') {
      if (ret.watchlist || ret.watched) {
        ret.account_status = ret.watchlist
          ? 'watchlist'
          : ret.watched && 'watched';
      }
    } else {
      if (ret.number_of_episodes === ret.episode_watched.length) {
        ret.account_status = 'watched';
      } else if (ret.episode_watched.length > 0) {
        ret.account_status = 'watching';
      } else {
        ret.account_status = 'watchlist';
      }
    }
    // delete ret.user_id;
    delete ret.__v;
  },
});
