import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type TVDocument = TV & Document;

@Schema()
export class TV {
  @Prop({ type: Number, index: true, required: true })
  id: number;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, default: 'tv' })
  media_type: string;

  @Prop({ type: Boolean, default: false, index: true })
  is_anime: boolean;

  @Prop({ type: Number, default: null })
  number_of_seasons: number | null;

  @Prop({ type: Number, default: null })
  number_of_episodes: number | null;

  @Prop({ type: Number, default: null })
  vote_average: number | null;

  @Prop({ type: Number, default: null })
  vote_count: number | null;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const TVSchema = SchemaFactory.createForClass(TV);
TVSchema.plugin(paginate);
TVSchema.index({ id: 1 }, { unique: true });
TVSchema.set('toJSON', {
  // transform: function (doc, ret) {
  //   delete ret._id;
  //   ret.id = Number(ret.id);
  //   delete ret.__v;
  // },
});
