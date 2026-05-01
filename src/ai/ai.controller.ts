import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { GeminiService } from './gemini.service';

@Controller('ai')
export class AiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Public()
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Public()
  @Get('test')
  async test() {
    const result = await this.geminiService.generate(
      'Reply with one word: pong',
    );
    return { result };
  }
}
