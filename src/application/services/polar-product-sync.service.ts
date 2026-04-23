import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Polar } from '@polar-sh/sdk';
import { Service } from '../../domain/service/entities/service.entity';

/**
 * Keeps every local `Service` mirrored as a Polar Product so the PolarAdapter
 * can reference a valid `productId` when creating checkout sessions.
 *
 * Every method is best-effort: errors are logged but never thrown so a Polar
 * outage cannot block the admin CRUD. A service that failed to sync will be
 * retried on the next update, or manually by toggling it once.
 */
@Injectable()
export class PolarProductSyncService {
  private readonly logger = new Logger(PolarProductSyncService.name);
  private readonly polar: Polar;
  private readonly organizationId: string | undefined;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const server = (this.config.get<string>('POLAR_SERVER') ?? 'sandbox') as
      | 'sandbox'
      | 'production';
    const accessToken = this.config.get<string>('POLAR_ACCESS_TOKEN') ?? '';
    this.organizationId = this.config.get<string>('POLAR_ORGANIZATION_ID');
    this.enabled = Boolean(accessToken && this.organizationId);

    this.polar = new Polar({ server, accessToken });

    if (!this.enabled) {
      this.logger.warn(
        'Polar sync disabled: POLAR_ACCESS_TOKEN and/or POLAR_ORGANIZATION_ID not set',
      );
    }
  }

  /**
   * Create the Polar Product if it doesn't exist, otherwise update it.
   * Returns the resulting Polar product id (or null on failure / disabled).
   */
  async syncService(service: Service): Promise<string | null> {
    if (!this.enabled) return service.polarProductId ?? null;

    const name =
      service.title?.en ||
      service.title?.ar ||
      `Service ${service.id}`;
    const description = [service.description?.en, service.description?.ar]
      .filter(Boolean)
      .join('\n\n');
    const currency = (service.currency || 'USD').toLowerCase();
    const priceAmount = Math.round(Number(service.price) * 100);

    try {
      if (!service.polarProductId) {
        const created: any = await this.polar.products.create({
          organizationId: this.organizationId!,
          name,
          description: description || undefined,
          recurringInterval: null,
          prices: [
            {
              amountType: 'fixed',
              priceAmount,
              priceCurrency: currency,
            },
          ],
        } as any);
        this.logger.log(
          `Polar product created for service ${service.id}: ${created?.id}`,
        );
        return created?.id ?? null;
      }

      await this.polar.products.update({
        id: service.polarProductId,
        productUpdate: {
          name,
          description: description || undefined,
        },
      } as any);
      this.logger.log(
        `Polar product updated for service ${service.id}: ${service.polarProductId}`,
      );
      return service.polarProductId;
    } catch (error: any) {
      this.logger.error(
        `Polar product sync failed for service ${service.id}: ${error?.message ?? error}`,
      );
      return service.polarProductId ?? null;
    }
  }

  /**
   * Archive the Polar product. Polar doesn't truly delete paid products, so
   * archiving is the correct operation. Safe to call with null/unknown id.
   */
  async archiveService(service: Service): Promise<void> {
    if (!this.enabled) return;
    if (!service.polarProductId) return;

    try {
      await this.polar.products.update({
        id: service.polarProductId,
        productUpdate: { isArchived: true },
      } as any);
      this.logger.log(
        `Polar product archived for service ${service.id}: ${service.polarProductId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Polar product archive failed for service ${service.id}: ${error?.message ?? error}`,
      );
    }
  }
}
