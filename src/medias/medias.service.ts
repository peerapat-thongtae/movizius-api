import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Cron } from '@nestjs/schedule';
import { LineService } from 'src/line/line.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class MediasService {
  constructor(
    @Inject(forwardRef(() => LineService))
    private lineService: LineService,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ) {}
  create(createMediaDto: CreateMediaDto) {
    return 'This action adds a new media';
  }

  findAll() {
    return `This action returns all medias`;
  }

  findOne(id: number) {
    return `This action returns a #${id} media`;
  }

  update(id: number, updateMediaDto: UpdateMediaDto) {
    return `This action updates a #${id} media`;
  }

  remove(id: number) {
    return `This action removes a #${id} media`;
  }

  @Cron('7 20 * * *')
  async sendNotificationsToLine() {
    const respUser = await this.authService.findAll();
    const users = respUser.data;
    const findLineUsers = users.filter((val) => {
      return val.identities.find((iden) => iden.provider === 'line');
    });
    console.log(findLineUsers);

    for (const user of findLineUsers) {
      const userIdentity = user.identities?.find(
        (val) => val.provider === 'line',
      );
      console.log('1');
      this.lineService.pushMessage(userIdentity.user_id, {
        type: 'text',
        text: 'test',
      });
    }

    return;
  }
}
