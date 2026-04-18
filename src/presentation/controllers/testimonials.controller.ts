import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TestimonialsService } from '../../application/testimonials/testimonials.service';

@ApiTags('testimonials')
@Controller({ path: 'testimonials', version: '1' })
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all visible testimonials' })
  async findAll() {
    return this.testimonialsService.findAll();
  }
}
