import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceCategoriesService } from '../../application/service-categories/service-categories.service';
import { CreateServiceCategoryDto } from '../../application/service-categories/dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../../application/service-categories/dto/update-service-category.dto';
import { ReorderServiceCategoriesDto } from '../../application/service-categories/dto/reorder-service-categories.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';

@ApiTags('service-categories')
@Controller({ path: 'service-categories', version: '1' })
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active service categories' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all service categories (admin)' })
  async findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get service category by ID (admin)' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service category (admin)' })
  async create(@Body() dto: CreateServiceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set display order for categories (admin)' })
  async reorder(@Body() dto: ReorderServiceCategoriesDto) {
    await this.categoriesService.reorder(dto.orderedIds);
    return { ok: true };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service category (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle category active status (admin)' })
  async toggleActive(@Param('id') id: string) {
    return this.categoriesService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service category (admin)' })
  async delete(@Param('id') id: string) {
    await this.categoriesService.delete(id);
    return { ok: true };
  }
}
