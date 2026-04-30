import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ai')
export class AiController {
  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
