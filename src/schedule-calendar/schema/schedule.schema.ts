import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const paginate = require('mongoose-paginate-v2');

export type ScheduleDocument = Schedule & Document;

@Schema()
export class Schedule {
  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Object })
  medias: any;

  @Prop({ type: Number })
  latest_page: number;

  @Prop({ type: Number })
  total_pages: number;

  @Prop({ type: Number })
  total_results: number;

  @Prop({ type: Boolean, default: false })
  sended: boolean;

  @Prop({
    type: Date,
    default: new Date(),
    required: false,
  })
  updated_at: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
ScheduleSchema.plugin(paginate);
ScheduleSchema.set('toJSON', {
  // transform: function (doc, ret) {
  //   delete ret._id;
  //   ret.id = Number(ret.id);
  //   delete ret.__v;
  // },
});
