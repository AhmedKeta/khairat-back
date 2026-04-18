import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FaqService } from '../../application/faq/faq.service';

@ApiTags('faq')
@Controller({ path: 'faq', version: '1' })
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'Get all FAQs' })
  async findAll() {
    return this.faqService.findAll();
  }
}
