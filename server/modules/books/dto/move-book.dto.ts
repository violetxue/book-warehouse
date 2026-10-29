import { IsString, IsOptional, IsIn } from 'class-validator';

export class MoveBookDto {
  @IsOptional()
  @IsString()
  folderId!: string | null;
}
