import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type ImdbDocument = Imdb & Document;

@Schema()
export class Imdb {
  @Prop({ type: Object })
  ratings: any;

  // @Prop({ type: Types.Array, default: [] })
  // ids: string[];

  @Prop({ type: String })
  min_id: string;

  @Prop({ type: String })
  max_id: string;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const ImdbSchema = SchemaFactory.createForClass(Imdb);
// ImdbSchema.plugin(paginate);
// ImdbSchema.index({}, { unique: true });
ImdbSchema.set('toJSON', {
  transform: function (doc, ret) {
    // ret.id = ret._id;
    delete ret._id;
    // delete ret.user_id;
    delete ret.__v;
  },
});
