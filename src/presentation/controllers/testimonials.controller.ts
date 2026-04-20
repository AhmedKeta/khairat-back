import { AuthGuard } from '@nestjs/passport';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TestimonialsService } from '../../application/testimonials/testimonials.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { CreateTestimonialDto } from '../../application/testimonials/dto/create-testimonial.dto';
import { UpdateTestimonialDto } from '../../application/testimonials/dto/update-testimonial.dto';

@ApiTags('testimonials')
@Controller({ path: 'testimonials', version: '1' })
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all visible testimonials' })
  async findAll() {
    return this.testimonialsService.findAllVisible();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all testimonials (admin)' })
  async findAllAdmin() {
    return this.testimonialsService.findAllAdmin();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create testimonial (admin)' })
  async create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update testimonial (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @Patch(':id/toggle-visible')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle testimonial visibility (admin)' })
  async toggleVisible(@Param('id') id: string) {
    return this.testimonialsService.toggleVisibility(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete testimonial (admin)' })
  async delete(@Param('id') id: string) {
    return this.testimonialsService.delete(id);
  }
}
