import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';
import { IsEnum, IsNumber } from 'class-validator';
export class FilterMovieRequest {
  @IsNumber()
  page: number;

  @IsEnum(TodoStatusEnum)
  status: TodoStatusEnum;

  sort?: any;
}
