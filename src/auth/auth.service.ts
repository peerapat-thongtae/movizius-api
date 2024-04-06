/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { ManagementClient } from 'auth0';

@Injectable()
export class AuthService {
  private management = new ManagementClient({
    domain: 'dev-dxsfu1ajem7xnzwi.us.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
  });
  create(_createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return this.management.users.getAll();
  }

  findOne(id: string) {
    try {
      return this.management.users.get({ id: id });
    } catch (err) {
      console.log('error');
    }
  }

  update(id: number, _updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
