import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
export class FilterMovieRequest {
  @IsNumber()
  page: number;

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsOptional()
  @IsBoolean()
  no_detail: boolean;

  @IsEnum(TodoStatusEnum)
  status: TodoStatusEnum;

  sort?: any;
}
