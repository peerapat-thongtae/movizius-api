import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type MediaDocument = Media & Document;

@Schema()
export class Media {
  @Prop({ type: String, index: true, required: true })
  id: string;

  @Prop({ type: String, index: true, required: true })
  media_type: string;

  @Prop({ type: String })
  name: string;

  // @Prop({ type: Number, index: true, required: true })
  // season_number: string;

  // @Prop({ type: Number, index: true, required: true })
  // episode_number: string;

  @Prop({ type: Number, default: null })
  number_of_seasons: number | null;

  @Prop({ type: Number, default: null })
  number_of_episodes: number | null;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  @Prop({ type: Boolean, default: true })
  watchlist: boolean;

  @Prop({ type: Boolean, default: false })
  watched: boolean;

  @Prop({ type: Types.Array, default: [] })
  episode_watched: {
    season_number: number;
    episode_number: number;
    watched_at: Date;
  }[];

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  watchlisted_at: Date;

  @Prop({
    type: Date,
    required: false,
  })
  watched_at: Date;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
MediaSchema.plugin(paginate);
MediaSchema.index({}, { unique: true });
MediaSchema.set('toJSON', {
  transform: function (doc, ret) {
    // ret.id = ret._id;
    delete ret._id;
    // delete ret.user_id;
    delete ret.__v;
  },
});
