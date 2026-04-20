import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { TrackingService } from '../../application/tracking/tracking.service';
import { CreateVisitDto } from '../../application/tracking/dto/create-visit.dto';

@ApiTags('tracking')
@Controller({ path: 'tracking', version: '1' })
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('visit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Latest visit geo for a guest id (public)' })
  async getLatestVisit(
    @Query('guestId') guestIdCamel?: string,
    @Query('guest_id') guestIdSnake?: string,
  ) {
    const guestId = guestIdCamel?.trim() || guestIdSnake?.trim() || '';
    if (!guestId) {
      return { id: null, country: null, location: null };
    }
    const visit = await this.trackingService.findLatestByGuestId(guestId);
    if (!visit) {
      return { id: null, country: null, location: null };
    }
    return {
      id: visit.id,
      country: visit.country ?? null,
      location: visit.location ?? null,
    };
  }

  @Post('visit')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a marketing visit (public, same idea as misimu)' })
  async trackVisit(
    @Body() dto: CreateVisitDto,
    @Req() request: Request,
    @Headers('user-agent') userAgentHeader?: string,
  ) {
    const ipFromRequest = this.extractIp(request);
    return this.trackingService.create(dto, {
      ipFromRequest,
      userAgentHeader: userAgentHeader || null,
    });
  }

  private extractIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return raw?.trim() || null;
    }
    return (request.socket?.remoteAddress as string) || request.ip || null;
  }
}
