import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PolarProductSyncService } from './polar-product-sync.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly serviceRepository: ServiceRepositoryPort,
    private readonly polarSync: PolarProductSyncService,
  ) {}

  async findAll(filters: ServiceFilters) {
    return this.serviceRepository.findAll(filters);
  }

  async findById(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto) {
    const prices = (dto.prices ?? []).map((p) => ({
      currency: String(p.currency).toUpperCase(),
      amount: Number(p.amount),
    }));

    const service = await this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      prices,
      feedsCount: dto.feedsCount,
      images: dto.images || [],
      videos: dto.videos || [],
      isActive: true,
    });

    const polarProductId = await this.polarSync.syncService(service);
    if (polarProductId && polarProductId !== service.polarProductId) {
      return this.serviceRepository.update(service.id, { polarProductId });
    }
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findById(id);
    const payload: any = { ...dto };
    if (Array.isArray(dto.prices)) {
      payload.prices = dto.prices.map((p) => ({
        currency: String(p.currency).toUpperCase(),
        amount: Number(p.amount),
      }));
    }
    const updated = await this.serviceRepository.update(id, payload);

    const polarProductId = await this.polarSync.syncService(updated);
    if (polarProductId && polarProductId !== updated.polarProductId) {
      return this.serviceRepository.update(id, { polarProductId });
    }
    return updated;
  }

  async delete(id: string) {
    const service = await this.findById(id);
    await this.polarSync.archiveService(service);
    await this.serviceRepository.delete(id);
  }

  async toggleActive(id: string) {
    const service = await this.findById(id);
    return this.serviceRepository.update(id, { isActive: !service.isActive });
  }
}
