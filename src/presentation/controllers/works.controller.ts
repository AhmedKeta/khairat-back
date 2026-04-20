import { AuthGuard } from '@nestjs/passport';
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorksService } from '../../application/works/works.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { CreateOurWorkDto } from '../../application/works/dto/create-our-work.dto';
import { UpdateOurWorkDto } from '../../application/works/dto/update-our-work.dto';

@ApiTags('works')
@Controller({ path: 'works', version: '1' })
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all visible Our Works items' })
  async findAll() {
    return this.worksService.findAllVisible();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all Our Works items (admin)' })
  async findAllAdmin() {
    return this.worksService.findAllAdmin();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create work item (admin)' })
  async create(@Body() dto: CreateOurWorkDto) {
    return this.worksService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update work item (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateOurWorkDto) {
    return this.worksService.update(id, dto);
  }

  @Patch(':id/toggle-visible')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle work item visibility (admin)' })
  async toggleVisible(@Param('id') id: string) {
    return this.worksService.toggleVisibility(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete work item (admin)' })
  async delete(@Param('id') id: string) {
    return this.worksService.delete(id);
  }
}
