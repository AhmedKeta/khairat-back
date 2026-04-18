import { Controller, Post, Get, Body, Param, Headers, UseGuards, RawBodyRequest, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
    @Body() body: { orderId: string },
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.initiatePayment(body.orderId, user);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle EasyKash webhook' })
  async webhook(
    @Body() payload: Record<string, any>,
    @Headers('x-easykash-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  async findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
