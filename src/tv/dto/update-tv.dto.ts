import { PartialType } from '@nestjs/swagger';
import { CreateTvDto } from './create-tv.dto';

export class UpdateTvDto extends PartialType(CreateTvDto) {}
