import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { NeedLogin } from '@server/platform/need-login.decorator';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';

@Controller('api/folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async findAll() {
    return this.foldersService.findAll();
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateFolderDto) {
    const { userId } = req.userContext;
    return this.foldersService.create(dto, userId);
  }

  @NeedLogin()
  @Patch(':id')
  async rename(
    @Param('id') id: string,
    @Body() dto: RenameFolderDto,
  ) {
    return this.foldersService.rename(id, dto.name);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.foldersService.remove(id);
  }
}
