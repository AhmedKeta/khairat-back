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
import { ServiceMarksService } from '../../application/service-marks/service-marks.service';
import { CreateServiceMarkDto } from '../../application/service-marks/dto/create-service-mark.dto';
import { UpdateServiceMarkDto } from '../../application/service-marks/dto/update-service-mark.dto';
import { ReorderServiceMarksDto } from '../../application/service-marks/dto/reorder-service-marks.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';

@ApiTags('service-marks')
@Controller({ path: 'service-marks', version: '1' })
export class ServiceMarksController {
  constructor(private readonly marksService: ServiceMarksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active service marks' })
  async findAll() {
    return this.marksService.findAll();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all service marks (admin)' })
  async findAllAdmin() {
    return this.marksService.findAllAdmin();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get service mark by ID (admin)' })
  async findById(@Param('id') id: string) {
    return this.marksService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service mark (admin)' })
  async create(@Body() dto: CreateServiceMarkDto) {
    return this.marksService.create(dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set display order for marks (admin)' })
  async reorder(@Body() dto: ReorderServiceMarksDto) {
    await this.marksService.reorder(dto.orderedIds);
    return { ok: true };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service mark (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceMarkDto) {
    return this.marksService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle mark active status (admin)' })
  async toggleActive(@Param('id') id: string) {
    return this.marksService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service mark (admin)' })
  async delete(@Param('id') id: string) {
    await this.marksService.delete(id);
    return { ok: true };
  }
}
