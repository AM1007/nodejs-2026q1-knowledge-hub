import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ReindexDto } from './dto/reindex.dto';
import { SearchRagDto } from './dto/search-rag.dto';
import { RagService } from './services/rag.service';

@Controller('ai/rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  @Post('index')
  @HttpCode(HttpStatus.OK)
  async reindex(@Body() dto: ReindexDto) {
    this.logger.log(
      `Reindex requested: onlyPublished=${dto.onlyPublished ?? true}, articleIds=${dto.articleIds?.length ?? 'all'}`,
    );
    return this.ragService.indexBatch(dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async search(@Body() dto: SearchRagDto) {
    return this.ragService.search(dto);
  }
}
