import { TodoStatusEnum } from '../../medias/enum/todo-status.enum';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
export class FilterMovieRequest {
  @IsNumber()
  @IsOptional()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsBoolean()
  with_imdb_rating?: boolean;

  @IsOptional()
  @IsBoolean()
  no_detail?: boolean;

  @IsEnum(TodoStatusEnum)
  @IsOptional()
  status?: TodoStatusEnum;

  sort?: any;
}
