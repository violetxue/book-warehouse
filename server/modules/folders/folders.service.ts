import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, count, asc, isNull } from 'drizzle-orm';
import { folders, books } from '@server/database/schema';
import type { Folder } from '@shared/api.interface';
import type { CreateFolderDto } from './dto/create-folder.dto';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  private toFolder(row: typeof folders.$inferSelect, bookCount = 0): Folder {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parentId ?? null,
      sortOrder: row.sortOrder,
      bookCount,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async findAll(): Promise<Folder[]> {
    const folderRows = await this.db
      .select()
      .from(folders)
      .orderBy(asc(folders.sortOrder), asc(folders.createdAt));

    const result: Folder[] = [];
    for (const row of folderRows) {
      const countResult = await this.db
        .select({ count: count() })
        .from(books)
        .where(eq(books.folderId, row.id));
      result.push(this.toFolder(row, Number(countResult[0]?.count ?? 0)));
    }

    return result;
  }

  async create(dto: CreateFolderDto, userId: string): Promise<Folder> {
    if (!dto.name.trim()) {
      throw new BadRequestException('文件夹名称不能为空');
    }

    const maxOrderResult = await this.db
      .select({ maxOrder: count() })
      .from(folders)
      .where(
        dto.parentId ? eq(folders.parentId, dto.parentId) : isNull(folders.parentId),
      );

    const nextSortOrder = Number(maxOrderResult[0]?.maxOrder ?? 0);

    const result = await this.db
      .insert(folders)
      .values({
        name: dto.name.trim(),
        parentId: dto.parentId ?? null,
        sortOrder: nextSortOrder,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.toFolder(result[0], 0);
  }

  async rename(id: string, name: string): Promise<Folder> {
    if (!name.trim()) {
      throw new BadRequestException('文件夹名称不能为空');
    }

    const updated = await this.db
      .update(folders)
      .set({ name: name.trim() })
      .where(eq(folders.id, id))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('文件夹不存在');
    }

    return this.toFolder(updated[0]);
  }

  async remove(id: string): Promise<{ success: true }> {
    const folder = await this.db
      .select()
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);

    if (folder.length === 0) {
      throw new NotFoundException('文件夹不存在');
    }

    await this.db.delete(folders).where(eq(folders.id, id));

    return { success: true };
  }
}
