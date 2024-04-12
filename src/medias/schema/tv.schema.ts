import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type TVDocument = TV & Document;

@Schema()
export class TV {
  @Prop({ type: String, index: true, required: true })
  id: string;

  @Prop({ type: String })
  name: string;

  // @Prop({ type: Number, index: true, required: true })
  // season_number: string;

  // @Prop({ type: Number, index: true, required: true })
  // episode_number: string;

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

export const TVSchema = SchemaFactory.createForClass(TV);
TVSchema.plugin(paginate);
TVSchema.index({}, { unique: true });
TVSchema.set('toJSON', {
  transform: function (doc, ret) {
    // ret.id = ret._id;
    delete ret._id;
    // delete ret.user_id;
    delete ret.__v;
  },
});
