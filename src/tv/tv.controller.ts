import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TvService } from './tv.service';
import { TodoStatusEnum } from '../medias/enum/todo-status.enum';
import { AuthGuard } from '@nestjs/passport';

@Controller('v2/tv')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ transform: true }))
export class TvController {
  constructor(private readonly tvService: TvService) {}

  @Get('paginate/:status')
  paginate(@Param('status') status: TodoStatusEnum, @Req() req: any) {
    return this.tvService.findAll({
      ...req.query,
      user_id: req?.user?.sub,
      status,
    });
  }
}
