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
import { ServiceVoiceReviewsService } from '../../application/service-voice-reviews/service-voice-reviews.service';
import { CreateServiceVoiceReviewDto } from '../../application/service-voice-reviews/dto/create-service-voice-review.dto';
import { UpdateServiceVoiceReviewDto } from '../../application/service-voice-reviews/dto/update-service-voice-review.dto';
import { ReorderServiceVoiceReviewsDto } from '../../application/service-voice-reviews/dto/reorder-service-voice-reviews.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';

@ApiTags('service-voice-reviews')
@Controller({ path: 'services/:serviceId/voice-reviews', version: '1' })
export class ServiceVoiceReviewsController {
  constructor(
    private readonly voiceReviewsService: ServiceVoiceReviewsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get visible voice reviews for a service' })
  async findVisible(@Param('serviceId') serviceId: string) {
    return this.voiceReviewsService.findVisibleByServiceId(serviceId);
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all voice reviews for a service (admin)' })
  async findAllAdmin(@Param('serviceId') serviceId: string) {
    return this.voiceReviewsService.findAllByServiceId(serviceId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create voice review (admin)' })
  async create(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceVoiceReviewDto,
  ) {
    return this.voiceReviewsService.create(serviceId, dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder voice reviews (admin)' })
  async reorder(
    @Param('serviceId') serviceId: string,
    @Body() dto: ReorderServiceVoiceReviewsDto,
  ) {
    await this.voiceReviewsService.reorder(serviceId, dto.orderedIds);
    return { ok: true };
  }

  @Patch(':id/toggle-visible')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle voice review visibility (admin)' })
  async toggleVisible(
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
  ) {
    return this.voiceReviewsService.toggleVisibility(serviceId, id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update voice review (admin)' })
  async update(
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceVoiceReviewDto,
  ) {
    return this.voiceReviewsService.update(serviceId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete voice review (admin)' })
  async delete(
    @Param('serviceId') serviceId: string,
    @Param('id') id: string,
  ) {
    await this.voiceReviewsService.delete(serviceId, id);
    return { deleted: true };
  }
}
