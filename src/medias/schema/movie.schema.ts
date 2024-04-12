import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

export type MovieDocument = Movie & Document;

@Schema()
export class Movie {
  @Prop({ type: String, index: true, required: true })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, index: true, required: true })
  user_id: string;

  @Prop({ type: Boolean, default: true })
  watchlist: boolean;

  @Prop({ type: Boolean, default: false })
  watched: boolean;

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

export const MovieSchema = SchemaFactory.createForClass(Movie);
MovieSchema.plugin(paginate);
MovieSchema.index({}, { unique: true });
MovieSchema.set('toJSON', {
  transform: function (doc, ret) {
    // ret.id = ret._id;
    delete ret._id;
    // delete ret.user_id;
    delete ret.__v;
  },
});
