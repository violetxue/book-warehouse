import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsIn,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class DuplicateFileItem {
  @IsString()
  name!: string;

  @Type(() => Number)
  size!: number;
}

export class CheckDuplicateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DuplicateFileItem)
  files!: DuplicateFileItem[];
}
