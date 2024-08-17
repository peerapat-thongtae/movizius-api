import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';

export class CreateMovieDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsEnum(TodoStatusEnum)
  status: TodoStatusEnum;
}
