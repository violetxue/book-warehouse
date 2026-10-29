import { Injectable, Logger } from '@nestjs/common';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

export interface UploadedFileInfo {
  /** 通过 /api/files/<存储名> 可访问的 URL（存库 downloadUrl） */
  downloadUrl: string;
  /** 存储文件名（存库 filePath） */
  filePath: string;
  /** 固定为 local（存库 bucketId） */
  bucketId: string;
}

export interface DownloadResult {
  content: Readable;
  metadata: { name?: string; size?: number };
}

/**
 * 本地磁盘文件存储服务（替代平台 FileService）。
 * 上传文件保存在 UPLOAD_DIR（默认 data/uploads），通过 /api/files/ 前缀对外提供访问。
 */
@Injectable()
export class LocalFileService {
  private readonly logger = new Logger(LocalFileService.name);
  private readonly uploadDir: string;
  private readonly urlPrefix = '/api/files/';

  constructor() {
    this.uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'data/uploads');
    mkdirSync(this.uploadDir, { recursive: true });
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  /** 将上传的文件 buffer 落盘，返回可通过 /api/files/<存储名> 访问的信息 */
  async save(file: { originalname: string; buffer: Buffer }): Promise<UploadedFileInfo> {
    const safeName = basename(file.originalname).replace(/[\\/:*?"<>|]/g, '_');
    const ext = extname(safeName).toLowerCase();
    const storedName = `${Date.now()}-${randomUUID()}${ext}`;
    const fullPath = join(this.uploadDir, storedName);
    await new Promise<void>((resolve, reject) => {
      const stream = createWriteStream(fullPath);
      stream.on('error', reject);
      stream.on('finish', () => resolve());
      stream.write(file.buffer);
      stream.end();
    });
    return {
      downloadUrl: `${this.urlPrefix}${storedName}`,
      filePath: storedName,
      bucketId: 'local',
    };
  }

  /** 删除一个或多个文件（接受 downloadUrl 或存储文件名） */
  async remove(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        const name = this.resolveName(url);
        const fullPath = join(this.uploadDir, name);
        if (existsSync(fullPath)) unlinkSync(fullPath);
      } catch (error) {
        this.logger.warn(`删除文件失败: ${url}`, error as Error);
      }
    }
  }

  /** 按 URL 下载文件（流式读取），保持原有 download(url).asStream() 调用方式 */
  download(url: string): { asStream: () => Promise<DownloadResult> } {
    return {
      asStream: async () => {
        const name = this.resolveName(url);
        const fullPath = join(this.uploadDir, name);
        if (!existsSync(fullPath)) {
          throw new Error(`文件不存在: ${name}`);
        }
        const stats = statSync(fullPath);
        return {
          content: createReadStream(fullPath) as unknown as Readable,
          metadata: { name, size: stats.size },
        };
      },
    };
  }

  private resolveName(url: string): string {
    return basename(url);
  }
}
