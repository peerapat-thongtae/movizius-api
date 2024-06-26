/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ManagementClient } from 'auth0';

@Injectable()
export class AuthService {
  private management = new ManagementClient({
    domain: process.env.AUTH0_DOMAIN1,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  });
  constructor() {}
  create(_createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return this.management.users.getAll();
  }

  async findByLineId(lineId: string) {
    const resp = await this.management.users.getAll({
      // q: `identities.provider:line`,
      q: `identities.user_id:${lineId}`,
    });
    const users = resp.data;
    return users?.[0]?.user_id;
  }

  findOne(id: string) {
    return this.management.users.get({ id: id });
  }

  update(id: number, _updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
