import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type MovieDocument = Movie & Document;

@Schema()
export class Movie {
  @Prop({ type: Number, index: true, required: true })
  id: number;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String, default: 'movie' })
  media_type: string;

  @Prop({ type: Date, nullable: true, required: false })
  release_date: Date;

  @Prop({ type: Number, nullable: true, required: false })
  runtime: number;

  @Prop({ type: Boolean, default: false, index: true })
  is_anime: boolean;

  @Prop({ type: Number, default: null })
  vote_average: number | null;

  @Prop({ type: Number, default: null })
  vote_count: number | null;

  @Prop({ type: Object, default: null })
  metadata?: any;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
MovieSchema.plugin(paginate);
MovieSchema.index({ id: 1 }, { unique: true });
MovieSchema.set('toJSON', {
  // transform: function (doc, ret) {
  //   delete ret._id;
  //   ret.id = Number(ret.id);
  //   delete ret.__v;
  // },
});
