import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { toStoredUploadRef } from '../upload/upload-path.util';

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

    const images = (dto.images || []).map(toStoredUploadRef);
    const videos = (dto.videos || []).map(toStoredUploadRef);

    const displayOrder = await this.serviceRepository.getNextDisplayOrder();

    const service = await this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      prices,
      feedsCount: dto.feedsCount,
      images,
      videos,
      isActive: true,
      displayOrder,
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
    if (dto.images !== undefined) {
      payload.images = dto.images.map(toStoredUploadRef);
    }
    if (dto.videos !== undefined) {
      payload.videos = dto.videos.map(toStoredUploadRef);
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

  async reorder(orderedIds: string[]) {
    const count = await this.serviceRepository.countWhereIdsIn(orderedIds);
    if (count !== orderedIds.length) {
      throw new BadRequestException('One or more services do not exist');
    }
    await this.serviceRepository.reorder(orderedIds);
  }
}
