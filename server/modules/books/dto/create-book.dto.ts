import { IsString, IsOptional, IsNumber, IsNotEmpty, Min } from 'class-validator';
import type { CreateBookRequest } from '@shared/api.interface';

export class CreateBookDto implements CreateBookRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @IsString()
  @IsNotEmpty()
  bucketId!: string;

  @IsString()
  @IsNotEmpty()
  downloadUrl!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;

  @IsNumber()
  @Min(0)
  fileSize!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  folderId?: string;
}
