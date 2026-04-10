import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid categoryId: not a valid UUID');
    }
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(name: string, description: string) {
    return this.prisma.category.create({ data: { name, description } });
  }

  async update(id: string, name: string, description: string) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: { name, description },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.article.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      }),
      this.prisma.category.delete({ where: { id } }),
    ]);
  }
}
