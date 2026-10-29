import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { NeedLogin } from '@server/platform/need-login.decorator';
import { BooksService } from './books.service';
import { BookQueryDto } from './dto/book-query.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { MoveBookDto } from './dto/move-book.dto';
import { ReorderBookDto } from './dto/reorder-book.dto';
import { RenameBookDto } from './dto/rename-book.dto';
import { BatchRenameDto } from './dto/batch-rename.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';

@Controller('api/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('download/all')
  async downloadAll(@Res() res: Response): Promise<void> {
    return this.booksService.downloadAll(res);
  }

  @Get()
  async findAll(@Query() query: BookQueryDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @NeedLogin()
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateBookDto) {
    const { userId } = req.userContext;
    return this.booksService.create(dto, userId);
  }

  @Post('check-duplicate')
  async checkDuplicate(@Body() dto: CheckDuplicateDto) {
    return this.booksService.checkDuplicate(dto.files);
  }

  @NeedLogin()
  @Patch('batch/rename')
  async batchRename(@Req() req: Request, @Body() dto: BatchRenameDto) {
    const { userId } = req.userContext;
    return this.booksService.batchRename(dto, userId);
  }

  @NeedLogin()
  @Patch(':id/folder')
  async moveToFolder(
    @Param('id') id: string,
    @Body() dto: MoveBookDto,
  ) {
    return this.booksService.moveToFolder(id, dto.folderId);
  }

  @NeedLogin()
  @Post(':id/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderBookDto,
  ) {
    return this.booksService.reorder(id, dto.direction);
  }

  @NeedLogin()
  @Patch(':id/name')
  async rename(
    @Param('id') id: string,
    @Body() dto: RenameBookDto,
  ) {
    return this.booksService.rename(id, dto.title);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
