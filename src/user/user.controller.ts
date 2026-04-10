import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdatePasswordDto } from './dto';
import { applyPaginationAndSort } from '../common';
import { ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

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
    const users = (await this.userService.findAll()).map(this.excludePassword);
    return applyPaginationAndSort(users, { page, limit, sortBy, order });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return this.excludePassword(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(
      dto.login,
      dto.password,
      dto.role as unknown as UserRole,
    );
    return this.excludePassword(user);
  }

  @Put(':id')
  async updatePassword(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    const user = await this.userService.updatePassword(
      id,
      dto.oldPassword,
      dto.newPassword,
    );
    return this.excludePassword(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
  }

  private excludePassword(user: any) {
    const result = { ...user };
    delete result.password;
    return result;
  }
}
