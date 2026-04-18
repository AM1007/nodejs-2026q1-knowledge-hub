import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { SignupDto, LoginDto } from './dto';

interface JwtPayload {
  userId: string;
  login: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.userService.findByLogin(dto.login);
    if (existing) {
      throw new BadRequestException('Login is already taken');
    }
    return this.userService.create(dto.login, dto.password);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByLogin(dto.login);
    if (!user) {
      throw new ForbiddenException('Authentication failed');
    }

    const matches = await bcrypt.compare(dto.password, user.password);
    if (!matches) {
      throw new ForbiddenException('Authentication failed');
    }

    return this.generateTokens({
      userId: user.id,
      login: user.login,
      role: user.role.toLowerCase(),
    });
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET_REFRESH_KEY,
      expiresIn: process.env.TOKEN_REFRESH_EXPIRE_TIME || '24h',
    });

    return { accessToken, refreshToken };
  }
}
