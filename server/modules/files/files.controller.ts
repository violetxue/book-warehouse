import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { LocalFileService } from '@server/platform/local-file.service';
import { NeedLogin } from '@server/platform/need-login.decorator';

/** 上传大小上限：500MB（电子书文件一般远小于此） */
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024;

/**
 * 文件上传端点（替代平台 dataloom 云存储上传）。
 * 前端流程：FormData multipart 上传 → 拿到 { downloadUrl, filePath, bucketId } → 调用 /api/books 建条目。
 */
@Controller('api/files')
export class FilesController {
  constructor(private readonly fileService: LocalFileService) {}

  @Post('upload')
  @NeedLogin()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_SIZE },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('未收到文件内容');
    }
    return this.fileService.save({
      originalname: file.originalname,
      buffer: file.buffer,
    });
  }
}
