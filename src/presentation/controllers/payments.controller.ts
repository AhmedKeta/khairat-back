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
import { InitiatePaymentDto } from '../../application/payments/dto/initiate-payment.dto';
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
    @Body() body: InitiatePaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initiatePayment(body.orderId, user, body.locale);
  }

  /**
   * Per-gateway webhook endpoint. The trailing `:gatewayId` selects which
   * adapter verifies and parses the inbound callback (e.g. `polar`,
   * `paymob`). New gateways drop in by registering an adapter; no controller
   * changes required.
   */
  @Post('webhook/:gatewayId')
  @ApiOperation({ summary: 'Handle gateway-specific payment webhook' })
  async webhookForGateway(
    @Param('gatewayId') gatewayId: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleWebhook(
      gatewayId,
      req.rawBody ?? Buffer.from(''),
      req.headers as Record<string, string | string[] | undefined>,
      this.normalizeQuery(req.query),
    );
  }

  /**
   * Backwards-compat alias kept so existing Polar dashboard webhooks
   * configured against `/api/v1/payments/webhook` keep working without a
   * redeploy on the Polar side.
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Legacy webhook endpoint (forwards to Polar adapter)',
  })
  async legacyWebhook(@Req() req: RawBodyRequest<Request>) {
    return this.paymentsService.handleWebhook(
      'polar',
      req.rawBody ?? Buffer.from(''),
      req.headers as Record<string, string | string[] | undefined>,
      this.normalizeQuery(req.query),
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.findById(id, user);
  }

  private normalizeQuery(
    query: Record<string, any> | undefined,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    if (!query) return out;
    for (const [k, v] of Object.entries(query)) {
      if (v == null) continue;
      out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
    return out;
  }
}
