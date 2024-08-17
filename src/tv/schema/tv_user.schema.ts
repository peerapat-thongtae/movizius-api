import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type TVUserDocument = TVUser & Document;

@Schema({
  toJSON: {
    getters: true,
    virtuals: true,
  },
})
export class TVUser {
  @Prop({ type: Number, index: true, required: true })
  id: number;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  @Prop({ type: String, default: 'tv' })
  media_type: string;

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

  // @Prop({
  //   type: Date,
  //   required: false,
  //   index: true,
  // })
  // watched_at: Date;
  watched_at?: Date;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;

  account_status?: string;
}

export const TVUserSchema = SchemaFactory.createForClass(TVUser);
TVUserSchema.virtual('account_status').get(function () {
  return '';
});

TVUserSchema.plugin(paginate);
TVUserSchema.index({ id: 1, user_id: 1 }, { unique: true });
