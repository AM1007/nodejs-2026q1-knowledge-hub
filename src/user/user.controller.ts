import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdatePasswordDto } from './dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    const users = this.userService.findAll();
    return users.map(this.excludePassword);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const user = this.userService.findOne(id);
    return this.excludePassword(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    const user = this.userService.create(dto.login, dto.password, dto.role);
    return this.excludePassword(user);
  }

  @Put(':id')
  updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
    const user = this.userService.updatePassword(
      id,
      dto.oldPassword,
      dto.newPassword,
    );
    return this.excludePassword(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    this.userService.delete(id);
  }

  private excludePassword(user: any) {
    const { password, ...result } = user;
    return result;
  }
}
