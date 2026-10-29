import { IsString, IsIn } from 'class-validator';

export class ReorderBookDto {
  @IsString()
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}
