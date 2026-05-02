import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly serviceRepository: ServiceRepositoryPort,
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
    return this.serviceRepository.update(id, payload);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.serviceRepository.delete(id);
  }

  async toggleActive(id: string) {
    const service = await this.findById(id);
    return this.serviceRepository.update(id, { isActive: !service.isActive });
  }
}
