import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type MovieUserDocument = MovieUser & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
  },
})
export class MovieUser {
  @Prop({ type: Number, index: true, required: true })
  id: number;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  @Prop({ type: String, default: 'movie' })
  media_type: string;

  // @Prop({ type: Types.Array, default: [] })
  // episode_watched: {
  //   episode_id?: number;
  //   season_number: number;
  //   episode_number: number;
  //   watched_at: Date;
  // }[];

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

export const MovieUserSchema = SchemaFactory.createForClass(MovieUser);

MovieUserSchema.virtual('account_status').get(function () {
  if (this.watchlisted_at || this.watched_at) {
    if (this.watched_at) {
      return 'watched';
    }
    if (this.watchlisted_at && !this.watched_at) {
      return 'watchlist';
    }
  }

  return '';
});

MovieUserSchema.plugin(paginate);
MovieUserSchema.index({ id: 1, media_type: 1, user_id: 1 }, { unique: true });
