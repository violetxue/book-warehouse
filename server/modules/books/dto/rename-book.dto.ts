import { IsString, MinLength } from 'class-validator';

export class RenameBookDto {
  @IsString()
  @MinLength(1)
  title!: string;
}
