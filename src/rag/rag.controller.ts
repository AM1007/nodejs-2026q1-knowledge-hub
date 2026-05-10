import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ReindexDto } from './dto/reindex.dto';
import { SearchRagDto } from './dto/search-rag.dto';
import { RagService } from './services/rag.service';
import { ChatRagDto } from './dto/chat-rag.dto';

@Controller('ai/rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  async reindex(@Body() dto: ReindexDto) {
    this.logger.log(
      `Reindex requested: onlyPublished=${dto.onlyPublished ?? true}, articleIds=${dto.articleIds?.length ?? 'all'}, force=${dto.force ?? false}`,
    );
    return this.ragService.indexBatch(dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() dto: SearchRagDto) {
    return this.ragService.search(dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatRagDto) {
    return this.ragService.chat(dto);
  }

  @Delete('index/articles/:articleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromIndex(
    @Param('articleId', new ParseUUIDPipe({ version: '4' })) articleId: string,
  ): Promise<void> {
    await this.ragService.removeArticleFromIndex(articleId);
  }
}
