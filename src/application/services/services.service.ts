import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly serviceRepository: ServiceRepositoryPort) {}

  async findAll(filters: ServiceFilters) {
    return this.serviceRepository.findAll(filters);
  }

  async findById(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto) {
    return this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currency: dto.currency || 'USD',
      feedsCount: dto.feedsCount,
      images: dto.images || [],
      videos: dto.videos || [],
      isActive: true,
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findById(id);
    return this.serviceRepository.update(id, dto);
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
