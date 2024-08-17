import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type MediaUserDocument = MediaUser & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
  },
})
export class MediaUser {
  @Prop({ type: Number, index: true, required: true })
  id: number;

  // @Prop({ type: Number, required: false, default: null })
  // media_id: number | null;

  @Prop({ type: String, index: true, required: true })
  media_type: string;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  // @Prop({ type: Boolean, default: true })
  // watchlist: boolean;

  // @Prop({ type: Boolean, default: false })
  // watched: boolean;

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

  account_status?: string;
}

export const MediaUserSchema = SchemaFactory.createForClass(MediaUser);

MediaUserSchema.virtual('account_status').get(function () {
  if (this.media_type === 'movie') {
    if (this.watchlisted_at || this.watched_at) {
      if (this.watched_at) {
        return 'watched';
      }
      if (this.watchlisted_at && !this.watched_at) {
        return 'watchlist';
      }
    }
  } else {
  }
  return '';
});

MediaUserSchema.plugin(paginate);
MediaUserSchema.index({ id: 1, media_type: 1, user_id: 1 }, { unique: true });
