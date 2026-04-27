import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayPort } from '../../domain/payment/ports/payment-gateway.port';
import { PolarAdapter } from '../../infrastructure/external/polar.adapter';
import { PaymobAdapter } from '../../infrastructure/external/paymob.adapter';

export interface GatewaySelection {
  currency?: string | null;
  country?: string | null;
}

/**
 * Resolves the payment gateway to use for a given order based on a chain of
 * environment-driven mappings:
 *
 *   1. PAYMENT_GATEWAY_BY_CURRENCY=EGP:paymob,USD:polar
 *   2. PAYMENT_GATEWAY_BY_COUNTRY=EG:paymob
 *   3. PAYMENT_GATEWAY_DEFAULT=polar
 *
 * To add a new gateway, register its adapter in `PaymentsModule`, inject it
 * here, and add an entry to the registry below. Routing then becomes a pure
 * env change — no domain-code edits required.
 */
@Injectable()
export class PaymentGatewayRouter {
  private readonly logger = new Logger(PaymentGatewayRouter.name);
  private readonly registry: Map<string, PaymentGatewayPort>;

  constructor(
    private readonly configService: ConfigService,
    polar: PolarAdapter,
    paymob: PaymobAdapter,
  ) {
    this.registry = new Map<string, PaymentGatewayPort>([
      [polar.id, polar],
      [paymob.id, paymob],
    ]);
  }

  /**
   * Pick the gateway for a payment based on the order's currency and the
   * donor's country (currency wins; country is a fallback; default closes
   * out the chain).
   */
  resolve(selection: GatewaySelection): PaymentGatewayPort {
    const currency = (selection.currency ?? '').toUpperCase();
    const country = (selection.country ?? '').toUpperCase();

    const byCurrency = this.parseEnvMap('PAYMENT_GATEWAY_BY_CURRENCY');
    const byCountry = this.parseEnvMap('PAYMENT_GATEWAY_BY_COUNTRY');
    const fallback = (
      this.configService.get<string>('PAYMENT_GATEWAY_DEFAULT') ?? 'polar'
    ).toLowerCase();

    const id =
      (currency && byCurrency[currency]) ||
      (country && byCountry[country]) ||
      fallback;

    const gateway = this.registry.get(id);
    if (!gateway) {
      this.logger.warn(
        `Configured gateway "${id}" not registered; falling back to first available adapter`,
      );
      const first = this.registry.values().next().value;
      if (!first) {
        throw new BadRequestException('No payment gateway is registered');
      }
      return first;
    }

    this.logger.log(
      `Resolved gateway "${id}" for currency=${currency || '-'} country=${country || '-'}`,
    );
    return gateway;
  }

  /**
   * Look up a gateway by its stable id. Used by the webhook controller to
   * route inbound callbacks to the correct adapter for verification.
   */
  byId(id: string): PaymentGatewayPort {
    const key = (id ?? '').toLowerCase();
    const gateway = this.registry.get(key);
    if (!gateway) {
      throw new BadRequestException(`Unknown payment gateway: ${id}`);
    }
    return gateway;
  }

  /**
   * Parse an env var of the form `KEY:value,KEY2:value2` into a lowercased-
   * value, uppercased-key map. Values that don't match a registered gateway
   * are dropped so misconfiguration surfaces as a fallback rather than a
   * crash.
   */
  private parseEnvMap(envName: string): Record<string, string> {
    const raw = this.configService.get<string>(envName) ?? '';
    if (!raw.trim()) return {};
    const out: Record<string, string> = {};
    for (const pair of raw.split(',')) {
      const [k, v] = pair.split(':').map((s) => s?.trim() ?? '');
      if (!k || !v) continue;
      const value = v.toLowerCase();
      if (!this.registry.has(value)) {
        this.logger.warn(
          `${envName} maps "${k}" to unregistered gateway "${value}"; ignoring entry`,
        );
        continue;
      }
      out[k.toUpperCase()] = value;
    }
    return out;
  }
}
