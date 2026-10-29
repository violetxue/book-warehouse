import {
  IsArray,
  IsString,
  IsIn,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';

export class BatchRenameDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];

  @IsIn(['prefix', 'suffix', 'replace', 'sequential'])
  mode!: 'prefix' | 'suffix' | 'replace' | 'sequential';

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  replaceWith?: string;
}
