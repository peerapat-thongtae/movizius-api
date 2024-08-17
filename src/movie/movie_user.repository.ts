// import { model, Model } from 'mongoose';
// import { MediaUser, MediaUserSchema } from '../medias/schema/media_user.schema';
// import { InjectModel } from '@nestjs/mongoose';
// import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
// import { Injectable } from '@nestjs/common';
// // import { MediaTypeEnum } from '../medias/enum/media-type.enum';

// @Injectable()
// export class MovieUserRepository extends Model<MediaUser> {
//   constructor(
//     @InjectModel(MediaUser.name)
//     private mediaUserModel: Model<MediaUser>,

//     private media_type: string = 'movie',
//   ) {
//     super();
//   }

//   async createOrUpdate(payload: {
//     id: number;
//     user_id: string;
//     status: TodoStatusEnum;
//   }): Promise<MediaUser> {
//     const found = await this.findOne({
//       id: payload.id,
//       user_id: payload.user_id,
//       media_type: this.media_type,
//     });

//     if (!found) {
//       return this.mediaUserModel.create({
//         id: payload.id,
//         user_id: payload.user_id,
//         media_type: this.media_type,
//         watchlisted_at: new Date(),
//         watched_at:
//           payload.status === TodoStatusEnum.WATCHED ? new Date() : null,
//       });
//     } else {
//       await this.mediaUserModel.updateOne(
//         {
//           id: payload.id,
//           user_id: payload.user_id,
//           media_type: this.media_type,
//         },
//         {
//           id: payload.id,
//           user_id: payload.user_id,
//           media_type: this.media_type,
//           // watchlisted_at: new Date(),
//           watched_at:
//             payload.status === TodoStatusEnum.WATCHED ? new Date() : null,
//         },
//       );
//       return this.mediaUserModel.findOne({
//         id: payload.id,
//         user_id: payload.user_id,
//         media_type: this.media_type,
//       });
//     }
//   }
// }
