import { Global, Module } from '@nestjs/common';
import { LocalFileService } from './local-file.service';

/** 本地文件存储模块（全局提供 LocalFileService） */
@Global()
@Module({
  providers: [LocalFileService],
  exports: [LocalFileService],
})
export class StorageModule {}
