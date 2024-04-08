import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

export type ImdbDocument = Imdb & Document;

@Schema()
export class Imdb {
  @Prop({ type: String, index: true, required: true })
  id: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Number, default: 0 })
  rating: number;

  @Prop({ type: Number, default: 0 })
  votes: number;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const ImdbSchema = SchemaFactory.createForClass(Imdb);
ImdbSchema.plugin(paginate);
ImdbSchema.index({}, { unique: true });
