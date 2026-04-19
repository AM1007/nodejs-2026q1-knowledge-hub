import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdatePasswordDto } from './dto';
import { applyPaginationAndSort } from '../common';
import { ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const users = await this.userService.findAll();
    return applyPaginationAndSort(users, { page, limit, sortBy, order });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(
      dto.login,
      dto.password,
      dto.role as unknown as UserRole,
    );
  }

  @Put(':id')
  @Roles('admin', 'editor', 'viewer')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordDto,
    @Req() req: any,
  ) {
    const currentUser = req.user;

    if (dto.role !== undefined) {
      if (currentUser.role !== 'admin') {
        throw new ForbiddenException('Only admin can change roles');
      }
      return this.userService.updateRole(id, dto.role);
    }

    if (dto.oldPassword !== undefined && dto.newPassword !== undefined) {
      return this.userService.updatePassword(
        id,
        dto.oldPassword,
        dto.newPassword,
      );
    }

    throw new BadRequestException('Invalid update payload');
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
  }
}
