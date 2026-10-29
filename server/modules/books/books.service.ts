import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, or, ilike, desc, count, asc, isNull, gt, lt, sql } from 'drizzle-orm';
import { DRIZZLE_DATABASE } from '@server/platform/database.constants';
import { LocalFileService } from '@server/platform/local-file.service';
import type { Response } from 'express';
// archiver 8.x 的类型声明未导出工厂函数，独立部署版用 require 获取（返回 any，可调用）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver = require('archiver');
import { books, folders } from '@server/database/schema';
import type { Book, BookListResponse } from '@shared/api.interface';
import type { CreateBookDto } from './dto/create-book.dto';
import type { BookQueryDto } from './dto/book-query.dto';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
    private readonly fileService: LocalFileService,
  ) {}

  private toBook(row: typeof books.$inferSelect): Book {
    return {
      id: row.id,
      title: row.title,
      author: row.author ?? null,
      downloadUrl: row.downloadUrl,
      fileType: row.fileType,
      fileSize: Number(row.fileSize),
      description: row.description ?? null,
      folderId: row.folderId ?? null,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(query: BookQueryDto): Promise<BookListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (query.keyword) {
      conditions.push(
        or(
          ilike(books.title, `%${query.keyword}%`),
          ilike(books.author, `%${query.keyword}%`),
        ),
      );
    }
    if (query.fileType) {
      conditions.push(eq(books.fileType, query.fileType));
    }
    if (query.folderId === 'none') {
      conditions.push(isNull(books.folderId));
    } else if (query.folderId) {
      conditions.push(eq(books.folderId, query.folderId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [itemsResult, countResult] = await Promise.all([
      this.db
        .select()
        .from(books)
        .where(whereClause)
        .orderBy(asc(books.sortOrder), desc(books.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(books)
        .where(whereClause),
    ]);

    const items: Book[] = itemsResult.map((row: typeof books.$inferSelect) =>
      this.toBook(row),
    );
    const total = Number(countResult[0]?.count ?? 0);

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Book> {
    const result = await this.db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    return this.toBook(result[0]);
  }

  async create(dto: CreateBookDto, userId: string): Promise<Book> {
    const folderScope = dto.folderId
      ? eq(books.folderId, dto.folderId)
      : isNull(books.folderId);

    const maxOrderResult = await this.db
      .select({ max: count() })
      .from(books)
      .where(folderScope);

    const nextSortOrder = Number(maxOrderResult[0]?.max ?? 0);

    const result = await this.db
      .insert(books)
      .values({
        title: dto.title,
        author: dto.author ?? null,
        filePath: dto.filePath,
        bucketId: dto.bucketId,
        downloadUrl: dto.downloadUrl,
        fileType: dto.fileType,
        fileSize: dto.fileSize,
        description: dto.description ?? null,
        folderId: dto.folderId ?? null,
        sortOrder: nextSortOrder,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.toBook(result[0]);
  }

  async moveToFolder(id: string, folderId: string | null): Promise<Book> {
    if (folderId) {
      const folder = await this.db
        .select()
        .from(folders)
        .where(eq(folders.id, folderId))
        .limit(1);
      if (folder.length === 0) {
        throw new NotFoundException('目标文件夹不存在');
      }
    }

    const book = await this.db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);
    if (book.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    if (book[0].folderId === folderId) {
      return this.toBook(book[0]);
    }

    const targetScope = folderId
      ? eq(books.folderId, folderId)
      : isNull(books.folderId);
    const maxOrderResult = await this.db
      .select({ max: count() })
      .from(books)
      .where(targetScope);
    const newSortOrder = Number(maxOrderResult[0]?.max ?? 0);

    const updated = await this.db
      .update(books)
      .set({ folderId, sortOrder: newSortOrder })
      .where(eq(books.id, id))
      .returning();

    return this.toBook(updated[0]);
  }

  async reorder(id: string, direction: 'up' | 'down'): Promise<Book> {
    const book = await this.db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    if (book.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    const current = book[0];
    const folderScope = current.folderId
      ? eq(books.folderId, current.folderId)
      : isNull(books.folderId);

    let neighbor: typeof books.$inferSelect | undefined;

    if (direction === 'up') {
      const neighbors = await this.db
        .select()
        .from(books)
        .where(and(folderScope, lt(books.sortOrder, current.sortOrder)))
        .orderBy(desc(books.sortOrder))
        .limit(1);
      neighbor = neighbors[0];
    } else {
      const neighbors = await this.db
        .select()
        .from(books)
        .where(and(folderScope, gt(books.sortOrder, current.sortOrder)))
        .orderBy(asc(books.sortOrder))
        .limit(1);
      neighbor = neighbors[0];
    }

    if (!neighbor) {
      return this.toBook(current);
    }

    const neighborOrder = neighbor.sortOrder;
    const currentOrder = current.sortOrder;

    await Promise.all([
      this.db
        .update(books)
        .set({ sortOrder: neighborOrder })
        .where(eq(books.id, current.id)),
      this.db
        .update(books)
        .set({ sortOrder: currentOrder })
        .where(eq(books.id, neighbor.id)),
    ]);

    const result = await this.db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    return this.toBook(result[0]);
  }

  async rename(id: string, title: string): Promise<Book> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new BadRequestException('书名不能为空');
    }

    const updated = await this.db
      .update(books)
      .set({ title: trimmed })
      .where(eq(books.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    return this.toBook(updated[0]);
  }

  async batchRename(
    dto: {
      ids: string[];
      mode: 'prefix' | 'suffix' | 'replace' | 'sequential';
      value?: string;
      replaceWith?: string;
    },
    _userId: string,
  ): Promise<Book[]> {
    const targetBooks = await this.db
      .select()
      .from(books)
      .where(sql`${books.id} IN (${sql.join(dto.ids, sql`, `)})`)
      .orderBy(asc(books.sortOrder), desc(books.createdAt));

    if (targetBooks.length === 0) {
      throw new NotFoundException('未找到选中的书籍');
    }

    const updatedBooks: Book[] = [];

    for (let i = 0; i < targetBooks.length; i += 1) {
      const book = targetBooks[i];
      const baseName = book.title;
      let newTitle = baseName;

      switch (dto.mode) {
        case 'prefix':
          newTitle = `${dto.value ?? ''}${baseName}`;
          break;
        case 'suffix':
          newTitle = `${baseName}${dto.value ?? ''}`;
          break;
        case 'replace':
          if (dto.value !== undefined && dto.value !== '') {
            newTitle = baseName.split(dto.value).join(dto.replaceWith ?? '');
          }
          break;
        case 'sequential':
          newTitle = `${dto.value ?? '书籍'} ${i + 1}`;
          break;
      }

      const trimmed = newTitle.trim();
      if (!trimmed) continue;

      const updated = await this.db
        .update(books)
        .set({ title: trimmed })
        .where(eq(books.id, book.id))
        .returning();

      if (updated.length > 0) {
        updatedBooks.push(this.toBook(updated[0]));
      }
    }

    return updatedBooks;
  }

  async checkDuplicate(
    files: { name: string; size: number }[],
  ): Promise<{ duplicates: string[] }> {
    if (files.length === 0) {
      return { duplicates: [] };
    }

    const conditions = files.map(
      (f: { name: string; size: number }) =>
        and(
          eq(books.title, f.name),
          sql`${books.fileSize} = ${f.size}`,
        ),
    );

    const existing = await this.db
      .select({ title: books.title, fileSize: books.fileSize })
      .from(books)
      .where(or(...conditions));

    const existingKeys = new Set(
      existing.map(
        (row: { title: string; fileSize: number }) =>
          `${row.title}|${row.fileSize.toString()}`,
      ),
    );

    const duplicates = files
      .filter((f: { name: string; size: number }) =>
        existingKeys.has(`${f.name}|${f.size}`),
      )
      .map((f: { name: string; size: number }) => f.name);

    return { duplicates };
  }

  async remove(id: string): Promise<{ success: true }> {
    const book = await this.db
      .select()
      .from(books)
      .where(eq(books.id, id))
      .limit(1);

    if (book.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    const deleted = await this.db
      .delete(books)
      .where(eq(books.id, id))
      .returning({ id: books.id });

    if (deleted.length === 0) {
      throw new NotFoundException('书籍不存在');
    }

    try {
      await this.fileService.remove([book[0].downloadUrl]);
    } catch (error) {
      this.logger.warn('删除存储文件失败', error);
    }

    return { success: true };
  }

  async downloadAll(res: Response): Promise<void> {
    const allBooks = await this.db
      .select()
      .from(books)
      .orderBy(asc(books.sortOrder), desc(books.createdAt));

    if (allBooks.length === 0) {
      throw new BadRequestException('没有可下载的书籍');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="books-library.zip"',
    );

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err: Error) => {
      this.logger.error('打包下载失败', err);
      if (!res.headersSent) {
        res.status(500).end();
      }
    });

    archive.pipe(res);

    for (const book of allBooks) {
      try {
        const { content, metadata } = await this.fileService
          .download(book.downloadUrl)
          .asStream();

        const fileName = this.buildFileName(book, metadata);
        archive.append(content as unknown as NodeJS.ReadableStream, { name: fileName });
      } catch (error) {
        this.logger.warn(`下载书籍失败: ${book.title}`, error);
      }
    }

    await archive.finalize();
  }

  private buildFileName(
    book: typeof books.$inferSelect,
    metadata: { name?: string },
  ): string {
    const baseName = book.title.replace(/[\\/:*?"<>|]/g, '_');
    const ext = this.getExtension(metadata.name ?? book.filePath);
    return `${baseName}${ext}`;
  }

  private getExtension(fileName: string): string {
    const idx = fileName.lastIndexOf('.');
    if (idx === -1) return '';
    return fileName.slice(idx);
  }
}
