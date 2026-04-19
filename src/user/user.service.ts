import * as bcrypt from 'bcrypt';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly salt = parseInt(process.env.CRYPT_SALT, 10) || 10;
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(this.toResponse);
  }

  async findOne(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid userId: not a valid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(user);
  }

  async create(login: string, password: string, role?: UserRole) {
    const hashed = await bcrypt.hash(password, this.salt);
    const user = await this.prisma.user.create({
      data: {
        login,
        password: hashed,
        role: role ?? UserRole.VIEWER,
      },
    });
    return this.toResponse(user);
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid userId: not a valid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = await bcrypt.compare(oldPassword, user.password);
    if (!matches) {
      throw new ForbiddenException('Old password is wrong');
    }

    const hashed = await bcrypt.hash(newPassword, this.salt);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return this.toResponse(updated);
  }

  async updateRole(id: string, role: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid userId: not a valid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: role.toUpperCase() as UserRole },
    });
    return this.toResponse(updated);
  }

  async delete(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid userId: not a valid UUID');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction([
      this.prisma.comment.deleteMany({ where: { authorId: id } }),
      this.prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: null },
      }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }

  async findByLogin(login: string) {
    return this.prisma.user.findFirst({ where: { login } });
  }

  private toResponse(user: any) {
    return {
      id: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt.getTime(),
    };
  }
}
