import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  PaymentGatewayPort,
  InitiatePaymentDto,
  PaymentGatewayResponse,
  WebhookPayload,
} from '../../domain/payment/ports/payment-gateway.port';

@Injectable()
export class EasyKashAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(EasyKashAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(dto: InitiatePaymentDto): Promise<PaymentGatewayResponse> {
    const merchantId = this.configService.get('EASYKASH_MERCHANT_ID');
    const secretKey = this.configService.get('EASYKASH_SECRET_KEY');
    const apiUrl = this.configService.get('EASYKASH_API_URL', 'https://api.easykash.net');

    this.logger.log(`Initiating EasyKash payment for order: ${dto.orderId}`);

    // Mock implementation - replace with actual EasyKash API call
    if (this.configService.get('NODE_ENV') !== 'production') {
      return {
        transactionId: `MOCK_TXN_${Date.now()}`,
        redirectUrl: `${this.configService.get('FRONTEND_URL')}/payment/mock?orderId=${dto.orderId}`,
        status: 'INITIATED',
        rawResponse: {
          mock: true,
          orderId: dto.orderId,
          amount: dto.amount,
        },
      };
    }

    try {
      const payload = {
        merchant_id: merchantId,
        order_id: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        customer_name: dto.customerName,
        customer_email: dto.customerEmail,
        customer_phone: dto.customerPhone,
        return_url: dto.returnUrl,
        webhook_url: dto.webhookUrl,
        signature: this.generateSignature(dto, secretKey),
      };

      const response = await axios.post(`${apiUrl}/payment/initiate`, payload);

      return {
        transactionId: response.data.transaction_id,
        redirectUrl: response.data.redirect_url,
        status: response.data.status,
        rawResponse: response.data,
      };
    } catch (error) {
      this.logger.error(`EasyKash payment initiation failed: ${error.message}`);
      throw error;
    }
  }

  verifyWebhookSignature(payload: Record<string, any>, signature: string): boolean {
    const secretKey = this.configService.get('EASYKASH_WEBHOOK_SECRET');

    // Mock verification for development
    if (this.configService.get('NODE_ENV') !== 'production') {
      return true;
    }

    const data = Object.keys(payload)
      .filter((k) => k !== 'signature')
      .sort()
      .map((k) => `${k}=${payload[k]}`)
      .join('&');

    const expected = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');

    return expected === signature;
  }

  async getTransactionStatus(transactionId: string): Promise<WebhookPayload> {
    const apiUrl = this.configService.get('EASYKASH_API_URL');
    const merchantId = this.configService.get('EASYKASH_MERCHANT_ID');

    if (this.configService.get('NODE_ENV') !== 'production') {
      return {
        transactionId,
        orderId: 'mock-order-id',
        status: 'SUCCESS',
        amount: 0,
        signature: 'mock',
        rawPayload: { mock: true },
      };
    }

    const response = await axios.get(`${apiUrl}/payment/${transactionId}`, {
      params: { merchant_id: merchantId },
    });

    return {
      transactionId: response.data.transaction_id,
      orderId: response.data.order_id,
      status: response.data.status === 'success' ? 'SUCCESS' : 'FAILED',
      amount: response.data.amount,
      signature: response.data.signature,
      rawPayload: response.data,
    };
  }

  private generateSignature(dto: InitiatePaymentDto, secretKey: string): string {
    const data = `${dto.orderId}|${dto.amount}|${dto.currency}`;
    return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  }
}
