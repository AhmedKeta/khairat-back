import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from '../../application/payments/payments.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for an order' })
  async initiate(
    @Body() body: { orderId: string; locale?: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initiatePayment(body.orderId, user, body.locale);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Polar.sh webhook (Standard Webhooks)' })
  async webhook(@Req() req: RawBodyRequest<Request>) {
    return this.paymentsService.handleWebhook(
      req.rawBody ?? Buffer.from(''),
      req.headers as Record<string, string | string[] | undefined>,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
